import { scrapeEmail} from "../main";

describe("scrapeEmail", () => {
    it("should return a list of links", async () => {
        const results = await scrapeEmail();
        expect(results.length).toBeGreaterThan(10);
    });
})