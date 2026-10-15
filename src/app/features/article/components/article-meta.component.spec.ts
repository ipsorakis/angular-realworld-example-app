import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ArticleMetaComponent } from "./article-meta.component";
import { makeArticle } from "../../../../testing/fixtures";

describe("ArticleMetaComponent", () => {
  it("renders the author and publication date", () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ArticleMetaComponent);
    fixture.componentRef.setInput("article", makeArticle());
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector(".author")!.textContent!.trim()).toBe("jake");
    expect(el.querySelector(".author")!.getAttribute("href")).toBe(
      "/profile/jake",
    );
    expect(el.querySelector("img")!.getAttribute("src")).toBe(
      "https://example.com/jake.png",
    );
    expect(el.querySelector(".date")!.textContent).toContain(
      "February 18, 2026",
    );
  });
});
