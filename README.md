<h1>Live Preview URL</h1>

Please use this link to test the Web Component functionality on the development theme:

https://cr4ftcode.myshopify.com/
Password: test

<h2>Required Pull Requests (Code Review)</h2>

The entire backend is centralized in the private repository (bundle-function) as requested. Two separate PRs were opened for independent review:

https://github.com/manuelz8/bundle-challenge/pull/2
https://github.com/manuelz8/bundle-challenge/pull/1

<h2>Setup and Rollback Instructions</h2>
<h3>Setup Steps</h3>

1- Install Shopify CLI: Ensure you have the latest version of the Shopify CLI installed locally.

<h3>Theme Setup (Frontend):</h3>

Pull the feature/review-frontend branch.

Run shopify theme dev to start the local preview.

Add the Bundle Block: Navigate to the Product Page in the Theme Editor. Add a new block of type "Product Bundle" just below the Add to Cart button, and select a product to feature in the bundle settings.

<h3>Backend Deployment & Installation:</h3>

From the private bundle-function repository, run shopify app deploy.

Install App: The CLI will provide a link to install the bundle-function app on the development store. This step is mandatory to activate the extensions.

The function was successfully enabled by running the cartTransformCreate mutation directly in GraphiQL (using the functionHandle).

Activation (UI Extension): Add the bundle-checkout-extension block to the Checkout Customizer to view the banner.

<h2>Rollback Plan</h2>

To fully remove the solution:

Backend: Uninstall the bundle-function app from the Shopify Admin.

Frontend: Remove the "Product Bundle" block from the product page in the Theme Editor.
