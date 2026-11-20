import {
  withAppBuildGradle,
  withGradleProperties,
  withPodfile,
} from 'expo/config-plugins';

/**
 * Ensures every CocoaPods target (including resource bundle targets like
 * RNCAsyncStorage_resources) has IPHONEOS_DEPLOYMENT_TARGET >= 15.1 so that
 * Xcode 27.1 (iPhoneOS27.1.sdk on EAS `image: "latest"`) compiles without
 * deployment-target range errors and satisfies Apple's ITMS-90725 iOS 27 SDK rule.
 */
function withIosDeploymentTargetFloor(config) {
  return withPodfile(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    const snippet = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do | build_config |
        if build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.1
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
        end
      end
    end`;
    if (contents.includes('react_native_post_install(') && !contents.includes("build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'")) {
      contents = contents.replace(
        /post_install do \|installer\|/,
        `post_install do |installer|${snippet}`,
      );
      modConfig.modResults.contents = contents;
    }
    return modConfig;
  });
}

/**
 * Enables full R8 bytecode optimization (`proguard-android-optimize.txt`) and
 * AGP optimized resource shrinking (`android.r8.optimizedResourceShrinking=true`)
 * so `BUNDLE-METADATA/com.android.tools/r8.json` reports:
 *   - isOptimizationsEnabled: true
 *   - resourceOptimization.isOptimizedShrinkingEnabled: true
 * for Google Play Android Vitals.
 */
function withAndroidR8Optimization(config) {
  config = withAppBuildGradle(config, (modConfig) => {
    if (typeof modConfig.modResults?.contents === 'string') {
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        /getDefaultProguardFile\(\s*["']proguard-android\.txt["']\s*\)/g,
        'getDefaultProguardFile("proguard-android-optimize.txt")',
      );
    }
    return modConfig;
  });

  config = withGradleProperties(config, (modConfig) => {
    const key = 'android.r8.optimizedResourceShrinking';
    modConfig.modResults = modConfig.modResults.filter(
      (item) => !(item.type === 'property' && item.key === key),
    );
    modConfig.modResults.push({
      type: 'property',
      key,
      value: 'true',
    });
    return modConfig;
  });

  return config;
}

export default ({ config }) =>
  withIosDeploymentTargetFloor(withAndroidR8Optimization({ ...config }));
