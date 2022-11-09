import axios from "axios";
import { JSDOM } from "jsdom";

const wikipediaUrl = "https://en.wikipedia.org/wiki/Casualties_of_the_Russo-Ukrainian_War?oldformat=true";

export type CasualtyData = {
  casualtyType: string;
  source: string;
  timePeriod: string;
  casualties: string;
};

export class CasualtiesLoader {
  constructor() {}

  public async extractCasualtiesFromWikipedia(): Promise<CasualtyData[]> {
    const table = await this.extractTotalCasualtiesTableFromWikipedia();
    const dom = new JSDOM(table);
    let rows = dom.window.document.querySelectorAll("tr");

    const totalCasualties: CasualtyData[] = [];
    let casualtyType = "";
    let rowSpanCounter = 0;
    for (let index = 1; index < rows.length; index++) {
      const row = rows[index];
      if (rowSpanCounter <= 0) {
        casualtyType = row.querySelector("th")?.textContent ?? "";
        rowSpanCounter = row.querySelector("th")?.rowSpan ?? 0;
      }
      totalCasualties.push(this.extractCasualtyDataFromRow(casualtyType, row));

      rowSpanCounter--;
    }
    return totalCasualties.filter((element) => element.casualtyType != undefined && element.casualtyType !== "");
  }

  private extractCasualtyDataFromRow(casualtyType: string, row: HTMLTableRowElement): CasualtyData {
    const cells = row.querySelectorAll("td");
    if (cells.length != 3) return {} as CasualtyData;
    const casualties = removeCitations(cells[0].textContent);
    const timePeriod = removeCitations(cells[1].textContent);
    const source = removeCitations(cells[2].textContent);
    return {
      casualtyType,
      source,
      timePeriod,
      casualties,
    };
  }

  private async getWikipediaPageContent(): Promise<string> {
    const response = await axios.get(wikipediaUrl);
    return response.data;
  }

  private async extractTotalCasualtiesTableFromWikipedia(): Promise<string> {
    const content = await this.getWikipediaPageContent();
    const start = content.indexOf(`<span class="mw-headline" id="Total_casualties">Total casualties</span>`);
    const end = content.indexOf("<p>", start);
    const contentWithoutLineBreaks = content.substring(start, end).replace(/\r|\n/g, "");
    const table = contentWithoutLineBreaks.match(/<table.*?><th.*>Breakdown<\/th><th.*>Casualties.*<\/table>/g);
    if (table) return table[0];
    return "";
  }
}

const removeCitations = (text: string | null): string => {
  if (text == null) return "";
  return text.replace(/\[.*?\]/g, "");
};
