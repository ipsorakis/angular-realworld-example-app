import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ArticleCommentComponent } from "./article-comment.component";
import { UserService } from "../../../core/auth/services/user.service";
import {
  makeComment,
  makeUser,
  UserServiceStub,
} from "../../../../testing/fixtures";

describe("ArticleCommentComponent", () => {
  let fixture: ComponentFixture<ArticleCommentComponent>;
  let users: UserServiceStub;
  const el = () => fixture.nativeElement as HTMLElement;

  function setup(username: string | null) {
    users = new UserServiceStub(username ? makeUser({ username }) : null);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: UserService, useValue: users }],
    });
    fixture = TestBed.createComponent(ArticleCommentComponent);
    fixture.componentRef.setInput("comment", makeComment());
    fixture.detectChanges();
  }

  it("renders the comment body and author", () => {
    setup(null);

    expect(el().querySelector(".card-text")!.textContent).toContain(
      "Great article!",
    );
    expect(el().textContent).toContain("anna");
    expect(el().querySelector(".date-posted")!.textContent).toContain(
      "February 18, 2026",
    );
  });

  it("lets the author delete their comment", () => {
    setup("anna");
    let deleted = false;
    fixture.componentInstance.delete.subscribe(() => (deleted = true));

    (el().querySelector(".ion-trash-a") as HTMLElement).click();

    expect(deleted).toBeTrue();
  });

  it("hides the delete action from other users", () => {
    setup("jake");

    expect(el().querySelector(".ion-trash-a")).toBeNull();
  });
});
