import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, Subject } from "rxjs";
import { ArticleListComponent } from "./article-list.component";
import { ArticlesService } from "../services/articles.service";
import { UserService } from "../../../core/auth/services/user.service";
import { LoadingState } from "../../../core/models/loading-state.model";
import { Article } from "../models/article.model";
import { makeArticle, UserServiceStub } from "../../../../testing/fixtures";

describe("ArticleListComponent", () => {
  let fixture: ComponentFixture<ArticleListComponent>;
  let articles: jasmine.SpyObj<ArticlesService>;

  const el = () => fixture.nativeElement as HTMLElement;
  const page = (list: Article[], articlesCount: number) =>
    of({ articles: list, articlesCount });

  beforeEach(() => {
    articles = jasmine.createSpyObj<ArticlesService>("ArticlesService", [
      "query",
    ]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ArticlesService, useValue: articles },
        { provide: UserService, useValue: new UserServiceStub() },
      ],
    });
    fixture = TestBed.createComponent(ArticleListComponent);
    fixture.componentRef.setInput("limit", 10);
  });

  it("does not query until a config is provided", () => {
    fixture.detectChanges();

    expect(articles.query).not.toHaveBeenCalled();
    expect(fixture.componentInstance.loading).toBe(LoadingState.NOT_LOADED);
  });

  it("shows a loading message while the request is in flight", () => {
    articles.query.and.returnValue(new Subject());
    fixture.componentRef.setInput("config", { type: "all", filters: {} });
    fixture.detectChanges();

    expect(el().textContent).toContain("Loading articles...");
  });

  it("queries the first page and renders previews with pagination", () => {
    const list = [makeArticle({ slug: "a" }), makeArticle({ slug: "b" })];
    articles.query.and.returnValue(page(list, 25));

    fixture.componentRef.setInput("config", { type: "all", filters: {} });
    fixture.detectChanges();

    expect(articles.query).toHaveBeenCalledWith({
      type: "all",
      filters: { limit: 10, offset: 0 },
    });
    expect(el().querySelectorAll("app-article-preview").length).toBe(2);
    expect(fixture.componentInstance.totalPages).toEqual([1, 2, 3]);
    expect(el().querySelector(".page-item.active")!.textContent).toContain("1");
  });

  it("moves to another page when a page link is clicked", () => {
    articles.query.and.returnValue(page([makeArticle()], 25));
    fixture.componentRef.setInput("config", { type: "all", filters: {} });
    fixture.detectChanges();

    el().querySelectorAll<HTMLButtonElement>(".page-link")[2].click();
    fixture.detectChanges();

    expect(fixture.componentInstance.currentPage).toBe(3);
    expect(articles.query.calls.mostRecent().args[0].filters).toEqual({
      limit: 10,
      offset: 20,
    });
    expect(el().querySelector(".page-item.active")!.textContent).toContain("3");
  });

  it("resets to the first page when the config changes", () => {
    articles.query.and.returnValue(page([], 0));
    fixture.componentRef.setInput("config", { type: "all", filters: {} });
    fixture.componentInstance.setPageTo(2);

    fixture.componentRef.setInput("config", { type: "feed", filters: {} });

    expect(fixture.componentInstance.currentPage).toBe(1);
  });

  it("shows an empty state when there are no articles", () => {
    articles.query.and.returnValue(page([], 0));
    fixture.componentRef.setInput("config", { type: "all", filters: {} });
    fixture.detectChanges();

    expect(el().textContent).toContain("No articles are here... yet.");
    expect(el().querySelectorAll(".page-item").length).toBe(0);
  });
});
