import { json, } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css";
import { boundary } from "@shopify/shopify-app-remix/server";
import { Provider } from "react-redux";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import store from "../redux/store";
import { authenticate } from "../shopify.server";
import React from "react";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export async function loader({ request }) {
  await authenticate.admin(request);

  return json({
    polarisTranslations: require("@shopify/polaris/locales/en.json"),
    apiKey: process.env.SHOPIFY_API_KEY,
  });
}

export default function App() {
  const { apiKey, polarisTranslations } = useLoaderData();

  return (
    <>
      <script
        src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
        data-api-key={apiKey}
      />

      <PolarisAppProvider i18n={polarisTranslations} linkComponent={RemixPolarisLink}>
        <Provider store={store}>
          <ui-nav-menu>
            <Link to="/app" rel="home"> Home </Link>
            {/* <Link to="/app/DiscountForm">DiscountForm</Link> */}
          </ui-nav-menu>
          <Outlet />
        </Provider>
      </PolarisAppProvider>
    </>
  );
};


/** @type {any} */
const RemixPolarisLink = React.forwardRef((props, ref) => (
  <Link {...props} to={props.url ?? props.to} ref={ref}>
    {props.children}
  </Link>
));

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
