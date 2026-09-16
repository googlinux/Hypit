/** Public settings responses contain metadata and booleans, never credential values. */
export type StudioSettingsContext = {
  readonly hasRun: boolean;
  readonly project: string;
  readonly profile?: string;
  readonly platform: string;
  readonly node: string;
};

export type StudioCredential = {
  readonly slot: string;
  readonly label: string;
  readonly storage: string;
  readonly configured: boolean;
  readonly writable: boolean;
};

export type StudioEndpoint = {
  readonly id: string;
  readonly provider: string;
  readonly origin?: string;
  readonly credentials: readonly StudioCredential[];
  readonly unavailable?: boolean;
};

export type StudioSettings = StudioSettingsContext & {
  readonly endpoints: readonly StudioEndpoint[];
};
