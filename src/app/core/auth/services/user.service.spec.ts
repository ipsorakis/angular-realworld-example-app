import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { Router } from "@angular/router";
import { UserService } from "./user.service";
import { JwtService } from "./jwt.service";
import { User } from "../user.model";
import { makeUser } from "../../../../testing/fixtures";

describe("UserService", () => {
  let service: UserService;
  let http: HttpTestingController;
  let jwt: jasmine.SpyObj<JwtService>;
  let router: jasmine.SpyObj<Router>;
  const user = makeUser();

  const currentUser = (): User | null => {
    let value: User | null = null;
    service.currentUser.subscribe((u) => (value = u)).unsubscribe();
    return value;
  };

  const isAuthenticated = (): boolean => {
    let value = false;
    service.isAuthenticated.subscribe((v) => (value = v)).unsubscribe();
    return value;
  };

  beforeEach(() => {
    jwt = jasmine.createSpyObj<JwtService>("JwtService", [
      "getToken",
      "saveToken",
      "destroyToken",
    ]);
    router = jasmine.createSpyObj<Router>("Router", ["navigate"]);
    router.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: JwtService, useValue: jwt },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("starts unauthenticated", () => {
    expect(currentUser()).toBeNull();
    expect(isAuthenticated()).toBeFalse();
  });

  it("logs in, stores the token and publishes the user", () => {
    const credentials = { email: user.email, password: "secret" };
    let response: { user: User } | undefined;

    service.login(credentials).subscribe((r) => (response = r));
    const req = http.expectOne("/users/login");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ user: credentials });
    req.flush({ user });

    expect(response).toEqual({ user });
    expect(jwt.saveToken).toHaveBeenCalledWith(user.token);
    expect(currentUser()).toEqual(user);
    expect(isAuthenticated()).toBeTrue();
  });

  it("registers a new user and authenticates them", () => {
    const credentials = {
      username: user.username,
      email: user.email,
      password: "secret",
    };

    service.register(credentials).subscribe();
    const req = http.expectOne("/users");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ user: credentials });
    req.flush({ user });

    expect(jwt.saveToken).toHaveBeenCalledWith(user.token);
    expect(currentUser()).toEqual(user);
  });

  it("does not authenticate when login fails", () => {
    let error: unknown;
    service
      .login({ email: user.email, password: "wrong" })
      .subscribe({ error: (e) => (error = e) });

    http
      .expectOne("/users/login")
      .flush(
        { errors: { "email or password": ["is invalid"] } },
        { status: 403, statusText: "Forbidden" },
      );

    expect(error).toBeTruthy();
    expect(jwt.saveToken).not.toHaveBeenCalled();
    expect(isAuthenticated()).toBeFalse();
  });

  it("loads the current user and authenticates them", () => {
    service.getCurrentUser().subscribe();
    const req = http.expectOne("/user");
    expect(req.request.method).toBe("GET");
    req.flush({ user });

    expect(jwt.saveToken).toHaveBeenCalledWith(user.token);
    expect(currentUser()).toEqual(user);
  });

  it("purges auth when loading the current user fails", () => {
    service.setAuth(user);

    service.getCurrentUser().subscribe({ error: () => undefined });
    http
      .expectOne("/user")
      .flush(null, { status: 401, statusText: "Unauthorized" });

    expect(jwt.destroyToken).toHaveBeenCalled();
    expect(currentUser()).toBeNull();
  });

  it("shares a single request between subscribers of getCurrentUser", () => {
    const current$ = service.getCurrentUser();
    const received: User[] = [];

    current$.subscribe(({ user }) => received.push(user));
    current$.subscribe(({ user }) => received.push(user));
    http.expectOne("/user").flush({ user });

    expect(received).toEqual([user, user]);
  });

  it("updates the user and publishes the new value without touching the token", () => {
    service.setAuth(user);
    jwt.saveToken.calls.reset();
    const updated = makeUser({ bio: "New bio" });

    service.update({ bio: "New bio" }).subscribe();
    const req = http.expectOne("/user");
    expect(req.request.method).toBe("PUT");
    expect(req.request.body).toEqual({ user: { bio: "New bio" } });
    req.flush({ user: updated });

    expect(currentUser()).toEqual(updated);
    expect(jwt.saveToken).not.toHaveBeenCalled();
  });

  it("logs out by purging auth and navigating home", () => {
    service.setAuth(user);

    service.logout();

    expect(jwt.destroyToken).toHaveBeenCalled();
    expect(currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(["/"]);
  });

  it("does not re-emit the same user instance", () => {
    const emissions: (User | null)[] = [];
    service.currentUser.subscribe((u) => emissions.push(u));

    service.setAuth(user);
    service.setAuth(user);

    expect(emissions).toEqual([null, user]);
  });
});
