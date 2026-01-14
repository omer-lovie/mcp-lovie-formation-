/**
 * Test script for Delaware Name Check API integration
 *
 * Usage:
 *   npm run dev scripts/test-name-check-api.ts
 */

import { createNameCheckClient } from '../src/services/agents/nameCheckClient';
import { isNameAvailable } from '../src/services/agents/types';
import chalk from 'chalk';

async function testNameCheckApi() {
  console.log(chalk.blue('🔍 Testing Delaware Name Check API Integration\n'));

  try {
    // Create client (will use environment-based URL selection)
    const client = createNameCheckClient();

    const testName = 'Delaware Tech Solutions';
    const entityEnding = 'LLC';
    const entityType = 'Y';

    console.log(chalk.gray('Testing name:'), chalk.white(testName));
    console.log(chalk.gray('Entity type:'), chalk.white(entityEnding));
    console.log(chalk.gray('Environment:'), chalk.white(process.env.NODE_ENV || 'development'));
    console.log(chalk.gray('API URL:'), chalk.white(
      process.env.NODE_ENV === 'production'
        ? process.env.NAME_CHECK_API_URL_SERVER
        : process.env.NAME_CHECK_API_URL
    ));
    console.log();

    // Check name availability
    console.log(chalk.yellow('⏳ Checking name availability...\n'));

    const result = await client.checkAvailability({
      baseName: testName,
      entityType,
      entityEnding,
    });

    // Display results
    console.log(chalk.green('✅ API Response:'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.gray('Company Name:'), chalk.white(result.companyName));
    console.log(chalk.gray('Status:'),
      result.status === 'available'
        ? chalk.green(result.status)
        : chalk.red(result.status)
    );
    console.log(chalk.gray('Checked At:'), chalk.white(new Date(result.checkedAt).toLocaleString()));
    console.log(chalk.gray('Response Time:'), chalk.white(`${result.responseTimeMs}ms`));
    console.log(chalk.gray('CAPTCHA Attempts:'), chalk.white(result.captchaAttempts));

    if (result.rejectionReasons) {
      console.log(chalk.gray('Rejection Reasons:'));
      result.rejectionReasons.forEach((reason, i) => {
        console.log(chalk.red(`  ${i + 1}. ${reason}`));
      });
    }

    console.log(chalk.gray('─'.repeat(60)));

    // Test helper function
    if (isNameAvailable(result)) {
      console.log(chalk.green('\n✅ Name is AVAILABLE for registration!'));
    } else {
      console.log(chalk.red('\n❌ Name is NOT available'));
    }

    // Test checkNameByType method
    console.log(chalk.blue('\n🧪 Testing checkNameByType method...\n'));

    const typeResult = await client.checkNameByType(
      'Another Test Company',
      'LLC'
    );

    console.log(chalk.green('✅ checkNameByType result:'));
    console.log(chalk.gray('Company Name:'), chalk.white(typeResult.companyName));
    console.log(chalk.gray('Status:'),
      typeResult.status === 'available'
        ? chalk.green(typeResult.status)
        : chalk.red(typeResult.status)
    );

    // Test checkNameWithCode method
    console.log(chalk.blue('\n🧪 Testing checkNameWithCode method...\n'));

    const codeResult = await client.checkNameWithCode(
      'Test Corporation',
      'C',
      'Inc.'
    );

    console.log(chalk.green('✅ checkNameWithCode result:'));
    console.log(chalk.gray('Company Name:'), chalk.white(codeResult.companyName));
    console.log(chalk.gray('Status:'),
      codeResult.status === 'available'
        ? chalk.green(codeResult.status)
        : chalk.red(codeResult.status)
    );

    console.log(chalk.green('\n✅ All tests passed!'));

  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }
    } else {
      console.error(chalk.red(String(error)));
    }
    process.exit(1);
  }
}

// Run the test
testNameCheckApi();
