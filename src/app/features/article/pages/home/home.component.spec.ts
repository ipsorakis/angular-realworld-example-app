import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { of } from "rxjs";
import HomeComponent from "./home.component";
import { TagsService } from "../../services/tags.service";
import { ArticlesService } from "../../services/articles.service";
import { UserService } from "../../../../core/auth/services/user.service";
import { UserServiceStub } from "../../../../../testing/fixtures";

describe("HomeComponent", () => {
  let fixture: ComponentFixture<HomeComponent>;
  let tags: jasmine.SpyObj<TagsService>;
  let articles: jasmine.SpyObj<ArticlesService>;
  let navigate: jasmine.Spy;
  const el = () => fixture.nativeElement as HTMLElement;

  async function render() {
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 50));
    fixture.detectChanges();
  }

  beforeEach(() => {
    tags = jasmine.createSpyObj<TagsService>("TagsService", ["getAll"]);
    tags.getAll.and.returnValue(of(["angular", "rxjs"]));
    articles = jasmine.createSpyObj<ArticlesService>("ArticlesService", [
      "query",
    ]);
    articles.query.and.returnValue(of({ articles: [], articlesCount: 0 }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TagsService, useValue: tags },
        { provide: ArticlesService, useValue: articles },
        { provide: UserService, useValue: new UserServiceStub() },
      ],
    });
    navigate = spyOn(TestBed.inject(Router), "navigate").and.resolveTo(true);
  });

  it("shows the global feed and banner to anonymous users", async () => {
    await render();

    expect(fixture.componentInstance.isAuthenticated).toBeFalse();
    expect(fixture.componentInstance.listConfig.type).toBe("all");
    expect(fixture.componentInstance.listConfig.filters.tag).toBeUndefined();
    expect(el().querySelector(".banner")).not.toBeNull();
    expect(articles.query).toHaveBeenCalled();
  });

  it("renders the popular tags", async () => {
    await render();

    expect(fixture.componentInstance.tagsLoaded).toBeTrue();
    expect(
      Array.from(el().querySelectorAll(".sidebar .tag-pill")).map((t) =>
        t.textContent!.trim(),
      ),
    ).toEqual(["angular", "rxjs"]);
  });

  it("filters the list by tag when a tag is clicked", async () => {
    await render();

    el().querySelector<HTMLElement>(".sidebar .tag-pill")!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.listConfig.type).toBe("all");
    expect(fixture.componentInstance.listConfig.filters.tag).toBe("angular");
    expect(el().querySelector(".feed-toggle")!.textContent).toContain(
      "angular",
    );
  });

  it("sends anonymous users to login when they ask for their feed", async () => {
    await render();

    fixture.componentInstance.setListTo("feed");

    expect(navigate).toHaveBeenCalledWith(["/login"]);
    expect(fixture.componentInstance.listConfig.type).toBe("all");
  });

  it("switches to the personal feed for authenticated users", async () => {
    await render();
    fixture.componentInstance.isAuthenticated = true;

    fixture.componentInstance.setListTo("feed");

    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.componentInstance.listConfig).toEqual({
      type: "feed",
      filters: {},
    });
  });
});
