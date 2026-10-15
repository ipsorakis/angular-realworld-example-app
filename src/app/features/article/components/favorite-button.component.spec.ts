import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { FavoriteButtonComponent } from "./favorite-button.component";
import { ArticlesService } from "../services/articles.service";
import { UserService } from "../../../core/auth/services/user.service";
import {
  makeArticle,
  makeUser,
  UserServiceStub,
} from "../../../../testing/fixtures";
import { Article } from "../models/article.model";

describe("FavoriteButtonComponent", () => {
  let fixture: ComponentFixture<FavoriteButtonComponent>;
  let articles: jasmine.SpyObj<ArticlesService>;
  let router: jasmine.SpyObj<Router>;
  let users: UserServiceStub;
  let emitted: boolean[];

  function setup(article: Article) {
    fixture = TestBed.createComponent(FavoriteButtonComponent);
    fixture.componentRef.setInput("article", article);
    emitted = [];
    fixture.componentInstance.toggle.subscribe((v) => emitted.push(v));
    fixture.detectChanges();
  }

  const button = () =>
    (fixture.nativeElement as HTMLElement).querySelector("button")!;

  beforeEach(() => {
    articles = jasmine.createSpyObj<ArticlesService>("ArticlesService", [
      "favorite",
      "unfavorite",
    ]);
    router = jasmine.createSpyObj<Router>("Router", ["navigate"]);
    router.navigate.and.resolveTo(true);
    users = new UserServiceStub(makeUser());
    TestBed.configureTestingModule({
      providers: [
        { provide: ArticlesService, useValue: articles },
        { provide: Router, useValue: router },
        { provide: UserService, useValue: users },
      ],
    });
  });

  it("favorites an article that is not yet favorited", () => {
    const article = makeArticle({ favorited: false });
    articles.favorite.and.returnValue(of({ ...article, favorited: true }));
    setup(article);
    expect(button().classList).toContain("btn-outline-primary");

    button().click();

    expect(articles.favorite).toHaveBeenCalledWith(article.slug);
    expect(emitted).toEqual([true]);
    expect(fixture.componentInstance.isSubmitting).toBeFalse();
  });

  it("unfavorites an already favorited article", () => {
    const article = makeArticle({ favorited: true });
    articles.unfavorite.and.returnValue(of(undefined));
    setup(article);
    expect(button().classList).toContain("btn-primary");

    button().click();

    expect(articles.unfavorite).toHaveBeenCalledWith(article.slug);
    expect(emitted).toEqual([false]);
  });

  it("sends anonymous users to the register page", () => {
    users.user$.next(null);
    setup(makeArticle());

    button().click();

    expect(router.navigate).toHaveBeenCalledWith(["/register"]);
    expect(articles.favorite).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it("re-enables the button when the request fails", () => {
    articles.favorite.and.returnValue(throwError(() => new Error("boom")));
    setup(makeArticle());

    button().click();

    expect(fixture.componentInstance.isSubmitting).toBeFalse();
    expect(emitted).toEqual([]);
  });
});
