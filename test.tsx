/* eslint-disable @shopify/jsx-no-hardcoded-content */
import React, {useEffect} from 'react';

// this should fail
const locale = shopify.config.locale;

// this should fail
export const loader = () => {
  const locale = shopify.config.locale;

  const nested = () => {
    const locale = shopify.config.locale;
  };

  function nested2() {
    const locale = shopify.config.locale;
  }

  const deeplyNested = () => {
    const locale = shopify.config.locale;
    const level1 = () => {
      const locale = shopify.config.locale;
      function level2() {
        const locale = shopify.config.locale;
      }
    };
  };
};

// this should fail
export async function action() {
  const locale = shopify.config.locale;

  const nested = () => {
    const locale = shopify.config.locale;
  };

  function nested2() {
    const locale = shopify.config.locale;
  }

  const deeplyNested = () => {
    const locale = shopify.config.locale;
    const level1 = () => {
      const locale = shopify.config.locale;
      function level2() {
        const locale = shopify.config.locale;
      }
    };
  };
}

// this should fail
export const headers = () => {
  const locale = shopify.config.locale;
};

// this should fail
export const links = () => {
  return shopify.config.locale;
};

// this should fail
export const meta = () => {
  const locale = shopify.config.locale;
  return {
    title: 'Something cool',
    description: 'This becomes the nice preview on search results.',
  };
};

// this should fail
export const shouldRevalidate = () => {
  return shopify.config.locale === 'en';
};

// this should fail
export const handle = {
  locale: shopify.config.locale,
};

// this shouldn't fail - it's a random function
export async function randomFunction() {
  const locale = shopify.config.locale;
  return locale;
}

export default function Simple() {
  // this should fail
  const locale = shopify.config.locale;

  // we don't want this to error
  const loader = () => {
    const locale = shopify.config.locale;
  };

  function action() {
    const locale = shopify.config.locale;
  }

  // works fine in a useEffect
  useEffect(() => {
    const locale = shopify.config.locale;
  }, []);

  // works fine in a callback, I assume this is what we want.
  const callback = () => {
    return shopify.config.locale;
  };

  return (
    <div lang={shopify.config.locale}>
      Hello! You are in the {locale} locale or {shopify.config.locale}
    </div>
  );
}
