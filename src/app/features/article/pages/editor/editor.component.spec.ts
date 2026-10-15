import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { of, throwError } from "rxjs";
import EditorComponent from "./editor.component";
import { ArticlesService } from "../../services/articles.service";
import { UserService } from "../../../../core/auth/services/user.service";
import {
  makeArticle,
  makeProfile,
  makeUser,
  UserServiceStub,
} from "../../../../../testing/fixtures";

describe("EditorComponent", () => {
  let harness: RouterTestingHarness;
  let articles: jasmine.SpyObj<ArticlesService>;
  let users: UserServiceStub;
  let navigate: jasmine.Spy;
  const article = makeArticle();

  const open = async (url: string) => {
    const component = await harness.navigateByUrl(url, EditorComponent);
    harness.detectChanges();
    return component;
  };

  beforeEach(async () => {
    articles = jasmine.createSpyObj<ArticlesService>("ArticlesService", [
      "get",
      "create",
      "update",
    ]);
    users = new UserServiceStub(makeUser());
    users.getCurrentUser.and.returnValue(of({ user: makeUser() }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: "editor", component: EditorComponent },
          { path: "editor/:slug", component: EditorComponent },
        ]),
        { provide: ArticlesService, useValue: articles },
        { provide: UserService, useValue: users },
      ],
    });
    harness = await RouterTestingHarness.create();
    navigate = spyOn(TestBed.inject(Router), "navigate").and.resolveTo(true);
  });

  describe("new article", () => {
    it("starts with an empty form", async () => {
      const component = await open("/editor");

      expect(articles.get).not.toHaveBeenCalled();
      expect(component.articleForm.value).toEqual({
        title: "",
        description: "",
        body: "",
      });
    });

    it("adds unique, non-blank tags and clears the input", async () => {
      const component = await open("/editor");

      for (const tag of ["angular", "angular", "   ", "rxjs"]) {
        component.tagField.setValue(tag);
        component.addTag();
      }
      harness.detectChanges();

      expect(component.tagList).toEqual(["angular", "rxjs"]);
      expect(component.tagField.value).toBe("");
      expect(
        harness.routeNativeElement!.querySelectorAll(".tag-list .tag-pill")
          .length,
      ).toBe(2);
    });

    it("adds a tag when Enter is pressed in the tag field", async () => {
      const component = await open("/editor");
      const input = harness.routeNativeElement!.querySelector<HTMLInputElement>(
        'input[placeholder="Enter tags"]',
      )!;
      input.value = "testing";
      input.dispatchEvent(new Event("input"));

      input.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));

      expect(component.tagList).toEqual(["testing"]);
    });

    it("removes a tag when its close icon is clicked", async () => {
      const component = await open("/editor");
      component.tagList = ["angular", "rxjs"];
      harness.detectChanges();

      harness
        .routeNativeElement!.querySelector<HTMLElement>(".ion-close-round")!
        .click();

      expect(component.tagList).toEqual(["rxjs"]);
    });

    it("creates the article, including a pending tag, and opens it", async () => {
      articles.create.and.returnValue(of(article));
      const component = await open("/editor");
      component.articleForm.setValue({
        title: "Title",
        description: "Desc",
        body: "Body",
      });
      component.tagField.setValue("pending");

      harness
        .routeNativeElement!.querySelector<HTMLButtonElement>(".btn-primary")!
        .click();

      expect(articles.create).toHaveBeenCalledWith({
        title: "Title",
        description: "Desc",
        body: "Body",
        tagList: ["pending"],
      });
      expect(navigate).toHaveBeenCalledWith(["/article/", article.slug]);
    });

    it("shows API errors and re-enables the form", async () => {
      articles.create.and.returnValue(
        throwError(() => ({ errors: { title: "can't be blank" } })),
      );
      const component = await open("/editor");

      component.submitForm();
      harness.detectChanges();

      expect(component.isSubmitting).toBeFalse();
      expect(
        harness.routeNativeElement!.querySelector(".error-messages")!
          .textContent,
      ).toContain("title can't be blank");
    });
  });

  describe("existing article", () => {
    it("loads the article for its author", async () => {
      articles.get.and.returnValue(of(makeArticle()));
      const component = await open(`/editor/${article.slug}`);

      expect(articles.get).toHaveBeenCalledWith(article.slug);
      expect(component.tagList).toEqual(["dragons", "training"]);
      expect(component.articleForm.value).toEqual({
        title: article.title,
        description: article.description,
        body: article.body,
      });
    });

    it("redirects home when the user is not the author", async () => {
      articles.get.and.returnValue(
        of(makeArticle({ author: makeProfile({ username: "someone-else" }) })),
      );

      const component = await open(`/editor/${article.slug}`);

      expect(navigate).toHaveBeenCalledWith(["/"]);
      expect(component.tagList).toEqual([]);
    });

    it("updates the article by slug", async () => {
      articles.get.and.returnValue(of(makeArticle()));
      articles.update.and.returnValue(of(article));
      const component = await open(`/editor/${article.slug}`);
      component.articleForm.patchValue({ title: "Updated" });

      component.submitForm();

      expect(articles.update).toHaveBeenCalledWith({
        title: "Updated",
        description: article.description,
        body: article.body,
        tagList: ["dragons", "training"],
        slug: article.slug,
      });
      expect(articles.create).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(["/article/", article.slug]);
    });
  });
});
