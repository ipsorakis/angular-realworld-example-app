import { TestBed } from "@angular/core/testing";
import { JwtService } from "./jwt.service";

describe("JwtService", () => {
  let service: JwtService;

  beforeEach(() => {
    window.localStorage.removeItem("jwtToken");
    service = TestBed.inject(JwtService);
  });

  afterEach(() => window.localStorage.removeItem("jwtToken"));

  it("returns undefined when no token is stored", () => {
    expect(service.getToken()).toBeUndefined();
  });

  it("saves and reads the token from localStorage", () => {
    service.saveToken("abc.def.ghi");

    expect(service.getToken()).toBe("abc.def.ghi");
    expect(window.localStorage.getItem("jwtToken")).toBe("abc.def.ghi");
  });

  it("destroys the stored token", () => {
    service.saveToken("abc");

    service.destroyToken();

    expect(service.getToken()).toBeUndefined();
    expect(window.localStorage.getItem("jwtToken")).toBeNull();
  });
});
