import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ArticlePreviewComponent } from "./article-preview.component";
import { ArticlesService } from "../services/articles.service";
import { UserService } from "../../../core/auth/services/user.service";
import { makeArticle, UserServiceStub } from "../../../../testing/fixtures";

describe("ArticlePreviewComponent", () => {
  let fixture: ComponentFixture<ArticlePreviewComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ArticlesService, useValue: {} },
        { provide: UserService, useValue: new UserServiceStub() },
      ],
    });
    fixture = TestBed.createComponent(ArticlePreviewComponent);
    fixture.componentRef.setInput("article", makeArticle());
    fixture.detectChanges();
  });

  it("renders the article summary, tags and link", () => {
    expect(el().querySelector("h1")!.textContent).toContain(
      "How to train your dragon",
    );
    expect(el().textContent).toContain("Ever wonder how?");
    expect(
      Array.from(el().querySelectorAll(".tag-list li")).map((li) =>
        li.textContent!.trim(),
      ),
    ).toEqual(["dragons", "training"]);
    expect(el().querySelector(".preview-link")!.getAttribute("href")).toBe(
      "/article/how-to-train-your-dragon",
    );
  });

  it("increments the count when favorited", () => {
    fixture.componentInstance.toggleFavorite(true);

    expect(fixture.componentInstance.article.favorited).toBeTrue();
    expect(fixture.componentInstance.article.favoritesCount).toBe(4);
  });

  it("decrements the count when unfavorited", () => {
    fixture.componentInstance.toggleFavorite(false);

    expect(fixture.componentInstance.article.favorited).toBeFalse();
    expect(fixture.componentInstance.article.favoritesCount).toBe(2);
  });
});
