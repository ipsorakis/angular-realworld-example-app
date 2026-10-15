import { TestBed } from "@angular/core/testing";
import { MarkdownPipe } from "./markdown.pipe";

describe("MarkdownPipe", () => {
  let pipe: MarkdownPipe;

  beforeEach(() => {
    pipe = TestBed.runInInjectionContext(() => new MarkdownPipe());
  });

  it("renders markdown to HTML", async () => {
    const html = await pipe.transform("# Title\n\nSome **bold** text");

    expect(html).toContain("Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("strips unsafe HTML", async () => {
    const html = await pipe.transform(
      '<script>alert("x")</script><img src="x" onerror="alert(1)">',
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
  });

  it("returns an empty string for empty content", async () => {
    expect(await pipe.transform("")).toBe("");
  });
});
