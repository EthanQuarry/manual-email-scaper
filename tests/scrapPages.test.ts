import { scrapePages} from "../main";

describe("scrapePages", () => {
    it("should return a list of links", async () => {
        const results = await scrapePages(0, 1);
        expect(results.length).toBeGreaterThan(10);
    });
})