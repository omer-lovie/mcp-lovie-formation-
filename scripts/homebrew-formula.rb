# Homebrew Formula Template for Lovie CLI (FR-001)
#
# Usage:
# 1. Update the version, url, and sha256 after each release
# 2. Submit to homebrew-core or maintain in a tap repository
# 3. Users install with: brew install lovie

class Lovie < Formula
  desc "CLI tool for streamlined US company formation"
  homepage "https://github.com/yourusername/lovie-cli"
  url "https://registry.npmjs.org/lovie/-/lovie-0.1.0.tgz"
  sha256 "UPDATE_WITH_ACTUAL_SHA256_AFTER_PUBLISHING"
  license "MIT"

  # Platform requirements (FR-005)
  depends_on "node@18"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    # Test that the CLI is installed and executable (FR-003)
    assert_match "0.1.0", shell_output("#{bin}/lovie --version")

    # Test help command works
    assert_match "company formation", shell_output("#{bin}/lovie --help")
  end
end

# Installation Instructions:
#
# For local tap (recommended for initial development):
# 1. Create a tap repository: brew tap-new yourusername/lovie
# 2. Copy this formula to: $(brew --repository)/Library/Taps/yourusername/homebrew-lovie/Formula/lovie.rb
# 3. Install with: brew install yourusername/lovie/lovie
#
# For homebrew-core submission (production):
# 1. Publish package to npm
# 2. Calculate sha256: curl -sL https://registry.npmjs.org/lovie/-/lovie-VERSION.tgz | shasum -a 256
# 3. Update url and sha256 in this formula
# 4. Submit PR to homebrew-core: https://github.com/Homebrew/homebrew-core
