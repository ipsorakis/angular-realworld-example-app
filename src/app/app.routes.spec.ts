import { TestBed } from "@angular/core/testing";
import { Route } from "@angular/router";
import { firstValueFrom, isObservable, Observable } from "rxjs";
import { routes } from "./app.routes";
import profileRoutes from "./features/profile/profile.routes";
import { UserService } from "./core/auth/services/user.service";
import { makeUser, UserServiceStub } from "../testing/fixtures";

function findRoute(path: string, list: Route[] = routes): Route {
  for (const route of list) {
    if (route.path === path) return route;
  }
  throw new Error(`No route ${path}`);
}

async function runGuard(route: Route, authenticated: boolean) {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: UserService,
        useValue: new UserServiceStub(authenticated ? makeUser() : null),
      },
    ],
  });
  const guard = route.canActivate![0] as () => Observable<boolean>;
  const result = TestBed.runInInjectionContext(guard);
  expect(isObservable(result)).toBeTrue();
  return firstValueFrom(result);
}

describe("app routes", () => {
  for (const path of ["login", "register"]) {
    it(`only lets anonymous users open /${path}`, async () => {
      expect(await runGuard(findRoute(path), false)).toBeTrue();
      TestBed.resetTestingModule();
      expect(await runGuard(findRoute(path), true)).toBeFalse();
    });
  }

  it("only lets authenticated users open /settings", async () => {
    expect(await runGuard(findRoute("settings"), true)).toBeTrue();
    TestBed.resetTestingModule();
    expect(await runGuard(findRoute("settings"), false)).toBeFalse();
  });

  it("only lets authenticated users open the editor", async () => {
    const editor = findRoute("editor");
    for (const child of editor.children!) {
      TestBed.resetTestingModule();
      expect(await runGuard(child, true)).toBeTrue();
      TestBed.resetTestingModule();
      expect(await runGuard(child, false)).toBeFalse();
    }
  });

  it("lazy-loads every page component", async () => {
    const lazy = [
      ...routes,
      ...findRoute("editor").children!,
      ...profileRoutes[0].children![0].children!,
    ].filter((r) => r.loadComponent);

    expect(lazy.length).toBe(9);
    for (const route of lazy) {
      const loaded = (await route.loadComponent!()) as { default?: unknown };
      expect(loaded.default ?? loaded).toBeDefined();
    }
  });

  it("lazy-loads the profile routes", async () => {
    const loaded = (await findRoute("profile").loadChildren!()) as {
      default: Route[];
    };

    expect(loaded.default).toBe(profileRoutes);
  });
});
