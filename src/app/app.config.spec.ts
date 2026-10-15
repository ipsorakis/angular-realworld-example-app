import { EMPTY, of } from "rxjs";
import { initAuth } from "./app.config";
import { JwtService } from "./core/auth/services/jwt.service";
import { UserService } from "./core/auth/services/user.service";
import { makeUser } from "../testing/fixtures";

describe("initAuth", () => {
  it("loads the current user when a token is stored", () => {
    const current$ = of({ user: makeUser() });
    const jwt = { getToken: () => "jwt" } as JwtService;
    const users = jasmine.createSpyObj<UserService>("UserService", [
      "getCurrentUser",
    ]);
    users.getCurrentUser.and.returnValue(current$);

    expect(initAuth(jwt, users)()).toBe(current$);
  });

  it("does nothing when no token is stored", () => {
    const jwt = { getToken: () => "" } as JwtService;
    const users = jasmine.createSpyObj<UserService>("UserService", [
      "getCurrentUser",
    ]);

    expect(initAuth(jwt, users)()).toBe(EMPTY);
    expect(users.getCurrentUser).not.toHaveBeenCalled();
  });
});
