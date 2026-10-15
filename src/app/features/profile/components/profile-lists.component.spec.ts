import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { of } from "rxjs";
import ProfileArticlesComponent from "./profile-articles.component";
import ProfileFavoritesComponent from "./profile-favorites.component";
import { ProfileService } from "../services/profile.service";
import { ArticlesService } from "../../article/services/articles.service";
import { UserService } from "../../../core/auth/services/user.service";
import { makeProfile, UserServiceStub } from "../../../../testing/fixtures";

describe("Profile article lists", () => {
  let harness: RouterTestingHarness;
  let profiles: jasmine.SpyObj<ProfileService>;
  let articles: jasmine.SpyObj<ArticlesService>;

  beforeEach(async () => {
    profiles = jasmine.createSpyObj<ProfileService>("ProfileService", ["get"]);
    profiles.get.and.returnValue(of(makeProfile()));
    articles = jasmine.createSpyObj<ArticlesService>("ArticlesService", [
      "query",
    ]);
    articles.query.and.returnValue(of({ articles: [], articlesCount: 0 }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: "articles/:username", component: ProfileArticlesComponent },
          {
            path: "profile/:username",
            children: [
              { path: "favorites", component: ProfileFavoritesComponent },
            ],
          },
        ]),
        { provide: ProfileService, useValue: profiles },
        { provide: ArticlesService, useValue: articles },
        { provide: UserService, useValue: new UserServiceStub() },
      ],
    });
    harness = await RouterTestingHarness.create();
  });

  it("lists articles written by the profile owner", async () => {
    const component = await harness.navigateByUrl(
      "/articles/jake",
      ProfileArticlesComponent,
    );
    harness.detectChanges();

    expect(profiles.get).toHaveBeenCalledWith("jake");
    expect(component.articlesConfig).toEqual({
      type: "all",
      filters: { author: "jake", limit: 10, offset: 0 },
    });
    expect(articles.query).toHaveBeenCalled();
  });

  it("lists articles favorited by the profile owner", async () => {
    const component = await harness.navigateByUrl(
      "/profile/jake/favorites",
      ProfileFavoritesComponent,
    );
    harness.detectChanges();

    expect(profiles.get).toHaveBeenCalledWith("jake");
    expect(component.favoritesConfig).toEqual({
      type: "all",
      filters: { favorited: "jake", limit: 10, offset: 0 },
    });
    expect(articles.query).toHaveBeenCalled();
  });
});
