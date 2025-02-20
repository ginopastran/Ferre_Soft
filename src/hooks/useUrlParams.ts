import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setUrlParam = (name: string, value: string | null) => {
    const params = new URLSearchParams(searchParams?.toString());

    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }

    const newUrl = `${pathname}${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    router.push(newUrl);
  };

  const getUrlParam = (name: string) => {
    return searchParams?.get(name) || "";
  };

  return { setUrlParam, getUrlParam, searchParams };
}
