export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-netflix-black px-4 text-center">
      <h1 className="text-[120px] font-black leading-none text-netflix-red md:text-[180px]">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-white md:text-3xl">Lost your way?</h2>
      <p className="mt-3 max-w-md text-netflix-light-gray">
        Sorry, we can&apos;t find that page. You&apos;ll find lots to explore on the home page.
      </p>
      <a
        href="/home"
        data-testid="not-found-home-link"
        className="mt-8 rounded bg-netflix-red px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-netflix-red-hover"
      >
        WebPhim Home
      </a>
    </div>
  );
}
