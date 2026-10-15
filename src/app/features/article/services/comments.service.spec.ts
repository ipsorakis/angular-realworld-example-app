import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { CommentsService } from "./comments.service";
import { makeComment } from "../../../../testing/fixtures";

describe("CommentsService", () => {
  let service: CommentsService;
  let http: HttpTestingController;
  const comment = makeComment();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CommentsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("gets all comments for an article", () => {
    let result: unknown;
    service.getAll("my-slug").subscribe((c) => (result = c));

    http.expectOne("/articles/my-slug/comments").flush({ comments: [comment] });

    expect(result).toEqual([comment]);
  });

  it("adds a comment", () => {
    let result: unknown;
    service.add("my-slug", "Nice!").subscribe((c) => (result = c));

    const req = http.expectOne("/articles/my-slug/comments");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ comment: { body: "Nice!" } });
    req.flush({ comment });
    expect(result).toEqual(comment);
  });

  it("deletes a comment", () => {
    service.delete("42", "my-slug").subscribe();

    const req = http.expectOne("/articles/my-slug/comments/42");
    expect(req.request.method).toBe("DELETE");
    req.flush(null);
  });
});
