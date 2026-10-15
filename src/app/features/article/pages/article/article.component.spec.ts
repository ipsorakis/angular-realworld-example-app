import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { config, of, throwError } from "rxjs";
import ArticleComponent from "./article.component";
import { ArticlesService } from "../../services/articles.service";
import { CommentsService } from "../../services/comments.service";
import { ProfileService } from "../../../profile/services/profile.service";
import { UserService } from "../../../../core/auth/services/user.service";
import { User } from "../../../../core/auth/user.model";
import {
  makeArticle,
  makeComment,
  makeProfile,
  makeUser,
  UserServiceStub,
} from "../../../../../testing/fixtures";

describe("ArticleComponent", () => {
  let harness: RouterTestingHarness;
  let articles: jasmine.SpyObj<ArticlesService>;
  let comments: jasmine.SpyObj<CommentsService>;
  let navigate: jasmine.Spy;
  const first = makeComment({ id: "1" });
  const second = makeComment({ id: "2", body: "Second" });

  async function open(user: User | null) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: "article/:slug", component: ArticleComponent }]),
        { provide: ArticlesService, useValue: articles },
        { provide: CommentsService, useValue: comments },
        { provide: ProfileService, useValue: {} },
        { provide: UserService, useValue: new UserServiceStub(user) },
      ],
    });
    harness = await RouterTestingHarness.create();
    navigate = spyOn(TestBed.inject(Router), "navigate").and.resolveTo(true);
    const component = await harness.navigateByUrl(
      "/article/how-to-train-your-dragon",
      ArticleComponent,
    );
    harness.detectChanges();
    return component;
  }

  const el = () => harness.routeNativeElement as HTMLElement;

  beforeEach(() => {
    articles = jasmine.createSpyObj<ArticlesService>("ArticlesService", [
      "get",
      "delete",
    ]);
    articles.get.and.callFake(() => of(makeArticle()));
    comments = jasmine.createSpyObj<CommentsService>("CommentsService", [
      "getAll",
      "add",
      "delete",
    ]);
    comments.getAll.and.callFake(() => of([first, second]));
  });

  it("loads the article and its comments", async () => {
    const component = await open(null);

    expect(articles.get).toHaveBeenCalledWith("how-to-train-your-dragon");
    expect(comments.getAll).toHaveBeenCalledWith("how-to-train-your-dragon");
    expect(component.comments).toEqual([first, second]);
    expect(el().querySelector("h1")!.textContent).toContain(
      "How to train your dragon",
    );
    expect(el().querySelectorAll("app-article-comment").length).toBe(2);
    expect(el().textContent).toContain("to add comments on this");
  });

  it("lets the author edit and delete the article", async () => {
    const component = await open(makeUser());

    expect(component.canModify).toBeTrue();
    expect(el().textContent).toContain("Edit Article");
    expect(el().querySelector("app-follow-button")).toBeNull();
  });

  it("shows follow and favorite actions to other users", async () => {
    const component = await open(makeUser({ username: "anna" }));

    expect(component.canModify).toBeFalse();
    expect(el().querySelector("app-follow-button")).not.toBeNull();
    expect(el().textContent).toContain("Favorite Article");
    expect(el().querySelector(".comment-form")).not.toBeNull();
  });

  it("redirects home when the article cannot be loaded", async () => {
    const original = config.onUnhandledError;
    config.onUnhandledError = () => undefined;
    articles.get.and.returnValue(throwError(() => new Error("404")));
    try {
      await open(null);
    } finally {
      config.onUnhandledError = original;
    }

    expect(navigate).toHaveBeenCalledWith(["/"]);
  });

  it("updates the favorite count when toggled", async () => {
    const component = await open(makeUser({ username: "anna" }));

    component.onToggleFavorite(true);
    expect(component.article.favorited).toBeTrue();
    expect(component.article.favoritesCount).toBe(4);

    component.onToggleFavorite(false);
    expect(component.article.favorited).toBeFalse();
    expect(component.article.favoritesCount).toBe(3);
  });

  it("updates the author's following state", async () => {
    const component = await open(makeUser({ username: "anna" }));

    component.toggleFollowing(makeProfile({ following: true }));

    expect(component.article.author.following).toBeTrue();
  });

  it("deletes the article and navigates home", async () => {
    articles.delete.and.returnValue(of(undefined));
    const component = await open(makeUser());

    el().querySelector<HTMLButtonElement>(".btn-outline-danger")!.click();

    expect(component.isDeleting).toBeTrue();
    expect(articles.delete).toHaveBeenCalledWith("how-to-train-your-dragon");
    expect(navigate).toHaveBeenCalledWith(["/"]);
  });

  it("posts a comment and prepends it to the list", async () => {
    const posted = makeComment({ id: "3", body: "New comment" });
    comments.add.and.returnValue(of(posted));
    const component = await open(makeUser({ username: "anna" }));
    component.commentControl.setValue("New comment");

    el().querySelector("form")!.dispatchEvent(new Event("submit"));

    expect(comments.add).toHaveBeenCalledWith(
      "how-to-train-your-dragon",
      "New comment",
    );
    expect(component.comments[0]).toBe(posted);
    expect(component.commentControl.value).toBe("");
    expect(component.isSubmitting).toBeFalse();
  });

  it("shows comment errors", async () => {
    comments.add.and.returnValue(
      throwError(() => ({ errors: { body: "can't be blank" } })),
    );
    const component = await open(makeUser({ username: "anna" }));

    component.addComment();
    harness.detectChanges();

    expect(component.isSubmitting).toBeFalse();
    expect(el().querySelector(".error-messages")!.textContent).toContain(
      "body can't be blank",
    );
  });

  it("removes a deleted comment", async () => {
    comments.delete.and.returnValue(of(undefined));
    const component = await open(makeUser({ username: "anna" }));

    component.deleteComment(first);

    expect(comments.delete).toHaveBeenCalledWith(
      "1",
      "how-to-train-your-dragon",
    );
    expect(component.comments).toEqual([second]);
  });
});
