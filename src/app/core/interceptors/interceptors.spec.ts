import { TestBed } from "@angular/core/testing";
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { apiInterceptor } from "./api.interceptor";
import { tokenInterceptor } from "./token.interceptor";
import { errorInterceptor } from "./error.interceptor";
import { JwtService } from "../auth/services/jwt.service";

describe("HTTP interceptors", () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let token: string | undefined;

  beforeEach(() => {
    token = undefined;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withInterceptors([
            apiInterceptor,
            tokenInterceptor,
            errorInterceptor,
          ]),
        ),
        provideHttpClientTesting(),
        { provide: JwtService, useValue: { getToken: () => token } },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  describe("apiInterceptor", () => {
    it("prefixes request URLs with the API base URL", () => {
      http.get("/tags").subscribe();

      const req = controller.expectOne("https://api.realworld.show/api/tags");
      expect(req.request.url).toBe("https://api.realworld.show/api/tags");
      req.flush({});
    });
  });

  describe("tokenInterceptor", () => {
    it("adds the Authorization header when a token is stored", () => {
      token = "jwt-123";

      http.get("/user").subscribe();

      const req = controller.expectOne("https://api.realworld.show/api/user");
      expect(req.request.headers.get("Authorization")).toBe("Token jwt-123");
      req.flush({});
    });

    it("omits the Authorization header when no token is stored", () => {
      http.get("/user").subscribe();

      const req = controller.expectOne("https://api.realworld.show/api/user");
      expect(req.request.headers.has("Authorization")).toBeFalse();
      req.flush({});
    });
  });

  describe("errorInterceptor", () => {
    it("rethrows the error response body", () => {
      const body = { errors: { email: "is invalid" } };
      let error: unknown;

      http.post("/users", {}).subscribe({ error: (e) => (error = e) });
      controller
        .expectOne("https://api.realworld.show/api/users")
        .flush(body, { status: 422, statusText: "Unprocessable Entity" });

      expect(error).toEqual(body);
    });

    it("passes successful responses through unchanged", () => {
      let response: unknown;

      http.get("/tags").subscribe((r) => (response = r));
      controller
        .expectOne("https://api.realworld.show/api/tags")
        .flush({ tags: ["a"] });

      expect(response).toEqual({ tags: ["a"] });
    });
  });
});
