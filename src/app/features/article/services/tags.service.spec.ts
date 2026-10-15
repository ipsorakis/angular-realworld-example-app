import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TagsService } from "./tags.service";

describe("TagsService", () => {
  it("gets all tags", () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    let result: unknown;

    TestBed.inject(TagsService)
      .getAll()
      .subscribe((t) => (result = t));
    http.expectOne("/tags").flush({ tags: ["angular", "rxjs"] });

    expect(result).toEqual(["angular", "rxjs"]);
    http.verify();
  });
});
