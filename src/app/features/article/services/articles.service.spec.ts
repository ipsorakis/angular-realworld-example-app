import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ArticlesService } from "./articles.service";
import { makeArticle } from "../../../../testing/fixtures";

describe("ArticlesService", () => {
  let service: ArticlesService;
  let http: HttpTestingController;
  const article = makeArticle();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ArticlesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("queries all articles with the filters as query params", () => {
    const page = { articles: [article], articlesCount: 1 };
    let result: unknown;

    service
      .query({
        type: "all",
        filters: { tag: "dragons", limit: 10, offset: 20 },
      })
      .subscribe((r) => (result = r));

    const req = http.expectOne((r) => r.url === "/articles");
    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("tag")).toBe("dragons");
    expect(req.request.params.get("limit")).toBe("10");
    expect(req.request.params.get("offset")).toBe("20");
    req.flush(page);
    expect(result).toEqual(page);
  });

  it("queries the personal feed", () => {
    service.query({ type: "feed", filters: {} }).subscribe();

    const req = http.expectOne("/articles/feed");
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ articles: [], articlesCount: 0 });
  });

  it("gets a single article by slug", () => {
    let result: unknown;
    service.get(article.slug).subscribe((a) => (result = a));

    http.expectOne(`/articles/${article.slug}`).flush({ article });

    expect(result).toEqual(article);
  });

  it("deletes an article", () => {
    service.delete(article.slug).subscribe();

    const req = http.expectOne(`/articles/${article.slug}`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });

  it("creates an article", () => {
    const draft = { title: "t", description: "d", body: "b", tagList: [] };
    let result: unknown;
    service.create(draft).subscribe((a) => (result = a));

    const req = http.expectOne("/articles/");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ article: draft });
    req.flush({ article });
    expect(result).toEqual(article);
  });

  it("updates an article by slug", () => {
    const changes = { slug: article.slug, title: "New title" };
    let result: unknown;
    service.update(changes).subscribe((a) => (result = a));

    const req = http.expectOne(`/articles/${article.slug}`);
    expect(req.request.method).toBe("PUT");
    expect(req.request.body).toEqual({ article: changes });
    req.flush({ article });
    expect(result).toEqual(article);
  });

  it("favorites an article", () => {
    let result: unknown;
    service.favorite(article.slug).subscribe((a) => (result = a));

    const req = http.expectOne(`/articles/${article.slug}/favorite`);
    expect(req.request.method).toBe("POST");
    req.flush({ article: { ...article, favorited: true } });
    expect(result).toEqual({ ...article, favorited: true });
  });

  it("unfavorites an article", () => {
    service.unfavorite(article.slug).subscribe();

    const req = http.expectOne(`/articles/${article.slug}/favorite`);
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });
});
