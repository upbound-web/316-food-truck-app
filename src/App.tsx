import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { LandingPage } from "./LandingPage";
import { Toaster } from "sonner";
import { CoffeeApp } from "./CoffeeApp";

export default function App() {
  return (
    <>
      <Content />
      <Toaster />
    </>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Authenticated>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
            <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
              ☕ 316 The Food Truck
            </h2>
            <SignOutButton />
          </header>
          <main className="flex-1">
            <CoffeeApp />
          </main>
        </div>
      </Authenticated>
      
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
    </>
  );
}
