import { SluggerWidgetSDK } from '../slugger-widget-sdk';

let sluggerSDK: SluggerWidgetSDK | null = null;

export function setSluggerSDK(sdk: SluggerWidgetSDK | null) {
  sluggerSDK = sdk;
}

export function getSluggerSDK(): SluggerWidgetSDK | null {
  return sluggerSDK;
}

export function getSluggerUserId(): string | null {
  if (sluggerSDK && sluggerSDK.isAuthenticated()) {
    const user = sluggerSDK.getUser();
    return user?.id || null;
  }
  return null;
}
