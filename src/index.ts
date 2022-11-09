import { createInterface } from "readline/promises";
import RiveScript from "rivescript";
import path from "path";
import { fileURLToPath } from "url";
import { CasualtiesLoader, CasualtyData } from "./casualties-reporter";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class Chatbot {
  private rs: RiveScript = new RiveScript();
  private resolveReady?: (value: boolean) => void;
  private ready = new Promise<boolean>((resolve) => {
    this.resolveReady = resolve;
  });

  private casualtyData: CasualtyData[] = [];

  private reader = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  constructor(path: string, private username: string = "local-user") {
    this.setup(path);
  }

  private async setup(path: string): Promise<void> {
    await Promise.all([this.rs.loadDirectory(path).catch(this.handleError), this.loadCasualtyData()]);
    this.rs.sortReplies();
    if (this.resolveReady) this.resolveReady(true);
  }

  public async startREPL(): Promise<void> {
    await this.ready;
    this.setupSubroutines();
    console.log("Chatbot ready.");

    while (true) {
      const message = await this.readInput();
      if (this.messageIndicatesQuit(message)) break;

      const reply = await this.rs.reply(this.username, message);
      await this.writeOutput(reply);
    }
    console.log("Chatbot shutting down.");
    process.exit(0);
  }

  private async readInput(): Promise<string> {
    return this.reader.question(`${this.username}> `);
  }

  private async writeOutput(message: string): Promise<void> {
    this.reader.write(`Bot> ${message}\n`);
  }

  private messageIndicatesQuit(message: string): boolean {
    const actualMessage = message.toLowerCase().trim();
    if (!actualMessage.startsWith(":")) return false;
    const command = actualMessage.substring(1).trim();
    return command === "quit" || command === "exit" || command === "q";
  }

  private setupSubroutines(): void {
    this.rs.setSubroutine("getCasualties", (rs, args) => this.lookupCasualties(rs, args));
  }

  private async lookupCasualties(rs: RiveScript, args: string[]): Promise<string> {
    const requestedSource = await rs.getUservar(this.username, "requestedSource");
    const requestedData = await rs.getUservar(this.username, "requestedData");
    if (requestedData === "russian") return this.lookupRussianSoldierCasualties(requestedSource);
    else if (requestedData === "ukrainian") return this.lookupUkrainianSoldierCasualties(requestedSource);
    else return this.lookupCivilianCasualties(requestedSource);
  }

  private async lookupCivilianCasualties(source: "ukrainian" | "neutral"): Promise<string> {
    const casualties = this.casualtyData.filter((element) => element.casualtyType.toLowerCase().includes("civilian"));
    return this.buildCasualtyResponse(casualties, source);
  }

  private lookupRussianSoldierCasualties(source: "ukrainian" | "russian"): string {
    const casualties = this.casualtyData.filter((element) => element.casualtyType.toLowerCase().includes("russian"));
    return this.buildCasualtyResponse(casualties, source);
  }

  private lookupUkrainianSoldierCasualties(source: "ukrainian" | "russian"): string {
    const casualties = this.casualtyData.filter((element) => element.casualtyType.toLowerCase().includes("ukrainian"));
    return this.buildCasualtyResponse(casualties, source);
  }

  private buildCasualtyResponse(casualties: CasualtyData[], source: "ukrainian" | "russian" | "neutral"): string {
    let selectedData: CasualtyData[] = this.selectDataBySource(source, casualties);

    return selectedData
      .map(
        (element) =>
          `According to ${element.source} casualties of ${element.casualtyType} from ${timeSpanToString(
            element.timePeriod
          )} are: ${element.casualties}.`
      )
      .join("\n");
  }

  private selectDataBySource(source: string, casualties: CasualtyData[]) {
    let selectedData: CasualtyData[];
    if (source === "russian")
      selectedData = casualties.filter((element) => element.source.toLowerCase().match(/russian/));
    else if (source === "ukrainian")
      selectedData = casualties.filter((element) => element.source.toLowerCase().match(/ukrainian/));
    else selectedData = casualties.filter((element) => !element.source.toLowerCase().match(/russian|ukrainian/));
    return selectedData;
  }

  private handleError(error: any): void {
    console.error(error);
  }

  private async loadCasualtyData(): Promise<void> {
    const loader = new CasualtiesLoader();
    this.casualtyData = await loader.extractCasualtiesFromWikipedia();
  }
}

const timeSpanToString = (timeSpan: string): string => {
  const matches = timeSpan.match(/([0-9]+ [A-Za-z]+) .* ([0-9]+ [A-Za-z]+)/);
  if (matches) return `${matches[1]} to ${matches[2]}`;
  return "";
};

const args = process.argv.slice(2);
let loadPath = `${__dirname}/`;
if (args.length > 0 && args[0].toLowerCase() === "eliza") {
  loadPath += "eliza";
  console.log("Loading Eliza bot...");
} else {
  loadPath += "warbot";
  console.log("Loading Warbot...");
}

const bot = new Chatbot(loadPath);
bot.startREPL();
