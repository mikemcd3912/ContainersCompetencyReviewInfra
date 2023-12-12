import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks';
import { Construct } from 'constructs';
import * as blueprints from '@aws-quickstart/eks-blueprints';

export default class ClusterConstruct extends Construct {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    const account = props?.env?.account!;
    const region = props?.env?.region!;

  // General Cluster Provider
    const clusterProvider = new blueprints.GenericClusterProvider({
        version: eks.KubernetesVersion.V1_27,
        managedNodeGroups: [
            {
                id: "ondemand",
                amiType: eks.NodegroupAmiType.AL2_X86_64,
                instanceTypes: [new ec2.InstanceType('m5.large')],
                desiredSize: 1,
                maxSize: 1, 
                launchTemplate: {
                    // You can pass Custom Tags to Launch Templates which gets propagated to worker nodes.
                    tags: {
                        "Name": "ondemand",
                        "Type": "Managed-Node-Group",
                        "Instance": "ONDEMAND"
                    }
                }
            },
            {
                id: "spot",
                instanceTypes: [new ec2.InstanceType('m5.large')],
                nodeGroupCapacityType: eks.CapacityType.SPOT,
                desiredSize: 1,
                minSize: 0,
                launchTemplate: {
                    machineImage: ec2.MachineImage.genericLinux({
                        'us-east-1': 'ami-08e520f5673ee0894',
                        'us-west-2': 'ami-0403ff342ceb30967',
                        'us-east-2': 'ami-07109d69738d6e1ee',
                        'us-west-1': 'ami-07bda4b61dc470985',
                        'us-gov-west-1': 'ami-0e9ebbf0d3f263e9b',
                        'us-gov-east-1':'ami-033eb9bc6daf8bfb1'
                    }),
                    // userData: userData,
                    // You can pass Custom Tags to Launch Templates which gets propagated to worker nodes.
                    tags: {
                        "Name": "spot",
                        "Type": "Managed-Node-Group",
                        "Instance": "SPOT"
                    }
                }
            },            
            {
                id: "gpu",
                amiType: eks.NodegroupAmiType.AL2_X86_64,
                instanceTypes: [new ec2.InstanceType('g5.xlarge12')],
                desiredSize: 1,
                maxSize: 1,                 
                launchTemplate: {
                    // userData: userData,
                    // You can pass Custom Tags to Launch Templates which gets propagated to worker nodes.
                    tags: {
                        "Name": "gpu",
                        "Type": "Managed-Node-Group",
                        "Instance": "GPU"
                    }
                }
            },
                        {
                id: "bottlerocket",
                instanceTypes: [new ec2.InstanceType('m5.large')],
                machineImageTypes: eks.MachineImageType.BOTTLEROCKET,
                desiredSize: 1,
                minSize: 1,
                launchTemplate: {
                    // userData: userData,
                    // You can pass Custom Tags to Launch Templates which gets propagated to worker nodes.
                    tags: {
                        "Name": "bottlerocket",
                        "Type": "Managed-Node-Group",
                        "Instance": "BOTTLEROCKET"
                    }
                }
            },
        ],
        fargateProfiles: {
            "fargate": {
                fargateProfileName: "fargate",
                selectors:  [{ namespace: "fargate" }] 
            }
        }
    });
    
  // Blueprint Build

    const blueprint = blueprints.EksBlueprint.builder()
    .version(eks.KubernetesVersion.V1_27)
    .account(account)
    .region(region)
    .clusterProvider(clusterProvider)
    .addOns(
      new blueprints.AwsLoadBalancerControllerAddOn,
      new blueprints.CertManagerAddOn,
      new blueprints.AdotCollectorAddOn,
      new blueprints.AppMeshAddOn,
      new blueprints.ClusterAutoScalerAddOn,
      new blueprints.NginxAddOn,
      new blueprints.ArgoCDAddOn,
      new blueprints.CalicoOperatorAddOn,
      new blueprints.MetricsServerAddOn,
      new blueprints.CloudWatchAdotAddOn,
      new blueprints.SecretsStoreAddOn
    )
    .teams()
    .build(scope, id+'-stack');
  }
}