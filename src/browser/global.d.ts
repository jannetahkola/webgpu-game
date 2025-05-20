declare global {
  interface UserAgentBrand {
    brand: string;
    version: string;
  }

  interface UserAgentHighEntropyValues {
    architecture: string;
    brands: UserAgentBrand[];
    mobile: boolean;
    model: string;
    platform: string;
    platformVersion: string;
    fullVersionList: UserAgentBrand[];
  }

  interface UserAgentData {
    getHighEntropyValues: (
      query: string[]
    ) => Promise<UserAgentHighEntropyValues>;
  }

  interface Navigator {
    userAgentData: UserAgentData;
  }
}

export {};
