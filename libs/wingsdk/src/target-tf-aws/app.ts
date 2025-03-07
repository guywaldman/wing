import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { IApp, CdktfApp, AppProps } from "../core";
import { PolyconFactory } from "./factory";

/**
 * An app that knows how to synthesize constructs into a Terraform configuration
 * for AWS resources.
 */
export class App extends CdktfApp implements IApp {
  constructor(props: AppProps = {}) {
    super({
      ...props,
      customFactory: props.customFactory ?? new PolyconFactory(),
    });
    new AwsProvider(this, "aws", {});
  }
}
