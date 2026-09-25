import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const config: NextConfig = {
  outputFileTracingIncludes: {
    "/.well-known/workflow/v1/flow": ["./agents/*/instructions.md"],
    "/*": ["./agents/*/instructions.md"],
  },
  webpack(webpackConfig) {
    webpackConfig.resolve.extensionAlias = { ".js": [".ts", ".js"] };
    return webpackConfig;
  },
};
export default withWorkflow(config);
