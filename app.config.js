import { withAppBuildGradle, withGradleProperties } from 'expo/config-plugins';

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

export default ({ config }) => withAndroidR8Optimization({ ...config });
