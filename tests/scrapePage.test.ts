import { scrapePage } from "../main";

describe("scrapePage", () => {
    it("should return a list of links", async () => {
        const results = await scrapePage("https://www.google.com/search?q=zenrows");
        expect(results.length).toBeGreaterThan(5);
    });
});