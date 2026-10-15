import { BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";
import { User } from "../app/core/auth/user.model";
import { Profile } from "../app/features/profile/models/profile.model";
import { Article } from "../app/features/article/models/article.model";
import { Comment } from "../app/features/article/models/comment.model";

export const makeUser = (overrides: Partial<User> = {}): User => ({
  email: "jake@jake.jake",
  token: "jwt.token.here",
  username: "jake",
  bio: "I work at statefarm",
  image: "https://example.com/jake.png",
  ...overrides,
});

export const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  username: "jake",
  bio: "I work at statefarm",
  image: "https://example.com/jake.png",
  following: false,
  ...overrides,
});

export const makeArticle = (overrides: Partial<Article> = {}): Article => ({
  slug: "how-to-train-your-dragon",
  title: "How to train your dragon",
  description: "Ever wonder how?",
  body: "It takes a **Jacobian**",
  tagList: ["dragons", "training"],
  createdAt: "2026-02-18T12:00:00.000Z",
  updatedAt: "2026-02-18T12:00:00.000Z",
  favorited: false,
  favoritesCount: 3,
  author: makeProfile(),
  ...overrides,
});

export const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: "1",
  body: "Great article!",
  createdAt: "2026-02-18T12:00:00.000Z",
  author: makeProfile({ username: "anna" }),
  ...overrides,
});

export class UserServiceStub {
  readonly user$: BehaviorSubject<User | null>;
  readonly currentUser;
  readonly isAuthenticated;
  login = jasmine.createSpy("login");
  register = jasmine.createSpy("register");
  logout = jasmine.createSpy("logout");
  getCurrentUser = jasmine.createSpy("getCurrentUser");
  update = jasmine.createSpy("update");

  constructor(user: User | null = null) {
    this.user$ = new BehaviorSubject<User | null>(user);
    this.currentUser = this.user$.asObservable();
    this.isAuthenticated = this.user$.pipe(map((u) => !!u));
  }
}
