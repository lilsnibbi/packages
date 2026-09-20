/**
 * Release / workflow driver for the @lilsnibbi packages.
 *
 *   bun pipeline.ts release --project=logger     # show pending Release Please PRs
 *   bun pipeline.ts retry   --project=logger --run=123456     # retry failed Release jobs
 *   bun pipeline.ts ci      --project=all                     # gh workflow run ci.yml
 *   bun pipeline.ts status  [--project=all]                   # recent workflow runs
 *   bun pipeline.ts check   --project=all                     # bun run check locally
 *   bun pipeline.ts pull    --project=all                     # git pull --ff-only
 *   bun pipeline.ts bootstrap --project=logger                # first commit on main, create GitHub repo, push
 *
 * Flags: --project=all|discord-kit|logger|toolkit (comma list ok), --run, --dry-run, --verbose
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

// ---- paint ------------------------------------------------------------------

const COLOR =
	!process.env.NO_COLOR &&
	process.env.TERM !== "dumb" &&
	(Boolean(process.env.FORCE_COLOR) || process.stdout.isTTY === true);

const wrap = (open: number, close = 39) => (text: string) =>
	COLOR ? `\x1b[${open}m${text}\x1b[${close}m` : text;

const bold = wrap(1, 22);
const dim = wrap(2, 22);
const red = wrap(31);
const green = wrap(32);
const yellow = wrap(33);
const blue = wrap(34);
const magenta = wrap(35);
const cyan = wrap(36);
const gray = wrap(90);

const ICON = {
	ok: green("✓"),
	fail: red("✗"),
	skip: yellow("○"),
	dry: magenta("◌"),
	pkg: blue("▸"),
	info: gray("·"),
} as const;

const width = Math.min(process.stdout.columns ?? 80, 80);
const rule = () => console.log(gray("─".repeat(width)));
const pad = (text: string, size: number) => text + " ".repeat(Math.max(0, size - text.length));

// ---- domain -----------------------------------------------------------------

const ROOT = import.meta.dir;
const PROJECTS = ["discord-kit", "logger", "toolkit"] as const;
type Project = (typeof PROJECTS)[number];

const COMMANDS = {
	release: "show pending Release Please PRs",
	retry: "retry failed jobs from an existing Release run",
	ci: "dispatch ci.yml",
	status: "show recent workflow runs",
	check: "run the local release gate (bun run check)",
	pull: "fast-forward the current branch from origin",
	bootstrap: "first commit on main, create the GitHub repo and push",
	help: "show this help",
} as const;
type Command = keyof typeof COMMANDS;


// ---- args -------------------------------------------------------------------

const flags = new Map<string, string>();
const positionals: string[] = [];
for (const arg of Bun.argv.slice(2)) {
	if (arg.startsWith("--")) {
		const [key, value = "true"] = arg.slice(2).split("=", 2);
		flags.set(key as string, value);
	} else positionals.push(arg);
}

const command = (positionals[0] ?? "help") as Command;
const dryRun = flags.has("dry-run");
const verbose = flags.has("verbose");
const runId = flags.get("run");

function help(): void {
	console.log();
	console.log(`  ${bold("pipeline")} ${dim("— release driver for @lilsnibbi packages")}`);
	console.log();
	console.log(`  ${dim("usage")}  bun pipeline.ts ${cyan("<command>")} ${yellow("--project=<all|name,…>")} ${gray("[--run=…] [--dry-run] [--verbose]")}`);
	console.log();
	console.log(`  ${dim("commands")}`);
	for (const [name, description] of Object.entries(COMMANDS)) {
		console.log(`    ${cyan(pad(name, 10))} ${description}`);
	}
	console.log();
	console.log(`  ${dim("projects")}  ${PROJECTS.map((p) => yellow(p)).join(dim(" · "))}${dim(" · ")}${yellow("all")}`);
	console.log(`  ${dim("verbose")}   ${gray("show the underlying git / gh commands and full errors")}`);
	console.log();
	console.log(`  ${dim("examples")}`);
	console.log(`    ${gray("$")} bun pipeline.ts release --project=logger`);
	console.log(`    ${gray("$")} bun pipeline.ts retry --project=logger --run=123456`);
	console.log(`    ${gray("$")} bun pipeline.ts bootstrap --project=all --dry-run`);
	console.log();
}

function fail(message: string): never {
	console.log();
	console.log(`  ${ICON.fail} ${red(message)}`);
	console.log(`  ${gray("run")} bun pipeline.ts help`);
	console.log();
	process.exit(1);
}

if (command === "help" || flags.has("help")) {
	help();
	process.exit(0);
}
if (!(command in COMMANDS)) fail(`unknown command "${command}"`);

function resolveProjects(): Project[] {
	const raw = flags.get("project") ?? (command === "status" || command === "pull" ? "all" : undefined);
	if (!raw) fail("--project is required");
	if (raw === "all") return [...PROJECTS];
	const picked = raw.split(",").map((p) => p.trim());
	for (const p of picked) if (!PROJECTS.includes(p as Project)) fail(`unknown project "${p}"`);
	return picked as Project[];
}

const projects = resolveProjects();
if (command === "retry" && !(runId && /^\d+$/.test(runId))) fail("--run=<Actions run ID> is required");

// ---- errors -----------------------------------------------------------------

class StepError extends Error {
	constructor(
		message: string,
		readonly detail = "",
	) {
		super(message);
	}
}

/** Translate raw git / gh stderr into one plain sentence. */
const EXPLANATIONS: [RegExp, string][] = [
	[/no git remotes found|does not have a remote|No such remote/i, "no GitHub remote yet — run bootstrap"],
	[/ambiguous argument 'HEAD'|does not have any commits yet/i, "no commits yet — run bootstrap"],
	[/could not find any workflows|workflow .* not found|HTTP 404/i, "workflow not found on GitHub — has this repo been pushed?"],
	[/not logged into|gh auth login/i, "gh is not logged in — run gh auth login"],
	[/not a git repository/i, "not a git repository"],
	[/Could not read from remote|Permission denied \(publickey\)|Authentication failed/i, "cannot reach the remote — check your GitHub auth"],
	[/non-fast-forward|fetch first|rejected/i, "remote has newer commits — pull first"],
	[/Not possible to fast-forward|diverged/i, "main has diverged from the remote — reconcile first"],
	[/nothing to commit/i, "nothing to commit"],
	[/already exists on github|Name already exists/i, "GitHub repo already exists — add it as origin instead"],
];

function explain(detail: string): string {
	for (const [pattern, text] of EXPLANATIONS) if (pattern.test(detail)) return text;
	return detail.trim().split("\n")[0]?.replace(/^(fatal|error):\s*/i, "") ?? "unknown error";
}

// ---- shell ------------------------------------------------------------------

interface Step {
	label: string;
	cmd: string[];
}

async function exec(dir: string, cmd: string[]): Promise<{ code: number; out: string; err: string }> {
	const result = await Bun.$`${cmd}`.cwd(dir).quiet().nothrow();
	return { code: result.exitCode, out: result.stdout.toString(), err: result.stderr.toString() };
}

async function step(dir: string, { label, cmd }: Step): Promise<string> {
	if (dryRun) {
		console.log(`    ${ICON.dry} ${dim(label)}`);
		if (verbose) console.log(`      ${gray(cmd.join(" "))}`);
		return "";
	}
	const { code, out, err } = await exec(dir, cmd);
	if (code !== 0) throw new StepError(label, err || out);
	console.log(`    ${ICON.ok} ${label}`);
	if (verbose) console.log(`      ${gray(cmd.join(" "))}`);
	return out.trim();
}

async function read(dir: string, label: string, cmd: string[]): Promise<string> {
	const { code, out, err } = await exec(dir, cmd);
	if (code !== 0) throw new StepError(label, err || out);
	return out.trim();
}

// ---- status -----------------------------------------------------------------

interface Run {
	status: string;
	conclusion: string;
	name: string;
	headBranch: string;
	event: string;
	createdAt: string;
	displayTitle: string;
}

function age(iso: string): string {
	const seconds = Math.max(0, (Date.now() - Date.parse(iso)) / 1000);
	if (seconds < 60) return `${Math.floor(seconds)}s`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
	return `${Math.floor(seconds / 86400)}d`;
}

function runIcon(run: Run): string {
	if (run.status !== "completed") return yellow("●");
	if (run.conclusion === "success") return ICON.ok;
	if (run.conclusion === "skipped" || run.conclusion === "cancelled") return ICON.skip;
	return ICON.fail;
}

async function showStatus(dir: string): Promise<void> {
	const json = await read(dir, "fetch workflow runs", [
		"gh",
		"run",
		"list",
		"--limit",
		"6",
		"--json",
		"status,conclusion,name,headBranch,event,createdAt,displayTitle",
	]);
	const runs = JSON.parse(json) as Run[];
	if (runs.length === 0) {
		console.log(`    ${ICON.info} ${dim("no workflow runs yet")}`);
		return;
	}
	for (const run of runs) {
		const title = run.displayTitle.length > 40 ? `${run.displayTitle.slice(0, 39)}…` : run.displayTitle;
		console.log(
			`    ${runIcon(run)} ${pad(run.name, 9)} ${cyan(pad(run.headBranch, 10))} ${gray(pad(run.event, 17))} ${dim(pad(age(run.createdAt), 4))} ${title}`,
		);
	}
}

// ---- commands ---------------------------------------------------------------

const dispatch = (workflow: string, label: string, inputs: string[] = []): Step => ({
	label,
	cmd: ["gh", "workflow", "run", workflow, ...inputs.flatMap((input) => ["-f", input])],
});

const handlers: Record<Exclude<Command, "help">, (dir: string) => Promise<void>> = {
	async release(dir) {
		const prs = await read(dir, "find release PRs", ["gh", "pr", "list", "--label", "autorelease: pending", "--state", "open"]);
		console.log(prs || "    No pending release PR. Push a fix: or feat: commit to main first.");
	},
	async retry(dir) {
		await step(dir, { label: `retrying failed jobs in run ${runId}`, cmd: ["gh", "run", "rerun", runId as string, "--failed"] });
	},
	async ci(dir) {
		await step(dir, dispatch("ci.yml", "CI started"));
	},
	status: showStatus,
	async check(dir) {
		await step(dir, { label: "release gate passed", cmd: ["bun", "run", "check"] });
	},
	async pull(dir) {
		const branch = await read(dir, "read current branch", ["git", "rev-parse", "--abbrev-ref", "HEAD"]);
		const out = await step(dir, { label: `pulled ${branch}`, cmd: ["git", "pull", "--ff-only"] });
		if (/Already up to date/i.test(out)) console.log(`    ${ICON.info} ${dim("already up to date")}`);
	},
	async bootstrap(dir) {
		const { code } = await exec(dir, ["git", "rev-parse", "--verify", "HEAD"]);
		if (code === 0) throw new StepError("already bootstrapped", "this repo already has commits — nothing to do");
		const name = (await Bun.file(join(dir, "package.json")).json()).name as string;
		const slug = name.replace(/^@/, "");
		await step(dir, { label: "staged everything", cmd: ["git", "add", "-A"] });
		await step(dir, { label: "first commit on main", cmd: ["git", "commit", "-m", "chore: initial commit"] });
		await step(dir, {
			label: `created github.com/${slug} and pushed main`,
			cmd: ["gh", "repo", "create", slug, "--public", "--source=.", "--remote=origin", "--push"],
		});
		console.log(`    ${ICON.info} ${dim("next: add RELEASE_TOKEN and NPM_TOKEN secrets on GitHub")}`);
	},
};

// ---- main -------------------------------------------------------------------

const meta = [
	runId && `run=${runId}`,
	dryRun && magenta("dry-run"),
]
	.filter(Boolean)
	.join(dim("  "));

console.log();
console.log(`  ${bold(magenta("◆"))} ${bold(command)}  ${gray(projects.join(", "))}${meta ? `  ${meta}` : ""}`);
rule();

const started = performance.now();
const results: { project: Project; ok: boolean }[] = [];

for (const project of projects) {
	const dir = join(ROOT, project);
	const manifest = join(dir, "package.json");
	const version = existsSync(manifest) ? ((await Bun.file(manifest).json()).version as string) : "";
	console.log(`  ${ICON.pkg} ${bold(project)}${version ? ` ${gray(`v${version}`)}` : ""}`);
	if (!existsSync(manifest)) {
		console.log(`    ${ICON.fail} ${red("folder missing")}`);
		results.push({ project, ok: false });
		continue;
	}
	try {
		await handlers[command as Exclude<Command, "help">](dir);
		results.push({ project, ok: true });
	} catch (error) {
		const failure = error instanceof StepError ? error : new StepError("unexpected error", String(error));
		console.log(`    ${ICON.fail} ${red(explain(failure.detail || failure.message))}`);
		if (verbose && failure.detail) {
			console.log(`      ${gray(failure.message)}`);
			for (const line of failure.detail.trim().split("\n")) console.log(`      ${gray(line)}`);
		}
		results.push({ project, ok: false });
	}
}

rule();
const okCount = results.filter((r) => r.ok).length;
const failCount = results.length - okCount;
const elapsed = `${((performance.now() - started) / 1000).toFixed(1)}s`;
const summary = [
	okCount > 0 && green(`${okCount} ok`),
	failCount > 0 && red(`${failCount} failed`),
]
	.filter(Boolean)
	.join(dim(" · "));
console.log(`  ${summary}  ${gray(elapsed)}${!verbose && failCount > 0 ? gray("  (--verbose for details)") : ""}`);
console.log();

process.exit(failCount > 0 ? 1 : 0);
