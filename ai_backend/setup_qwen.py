#!/usr/bin/env python3
"""
Setup script for Qwen 2.5 Vision-Language Model integration
"""

import subprocess
import sys
import os

def install_package(package):
    """Install a package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {package}: {e}")
        return False

def main():
    print("🧠 Setting up Qwen 2.5 Vision-Language Model...")
    print("=" * 60)
    
    # Required packages for Qwen 2.5
    packages = [
        "transformers>=4.37.0",
        "torch>=2.0.0", 
        "torchvision>=0.15.0",
        "accelerate",
        "sentencepiece",
        "qwen-vl-utils"
    ]
    
    print("📦 Installing required packages...")
    
    success_count = 0
    for package in packages:
        print(f"   Installing {package}...")
        if install_package(package):
            print(f"   ✅ {package} installed successfully")
            success_count += 1
        else:
            print(f"   ❌ Failed to install {package}")
    
    print("\n" + "=" * 60)
    
    if success_count == len(packages):
        print("🎉 All packages installed successfully!")
        print("\n💡 Next steps:")
        print("   1. Restart the AI backend: python3 simple_app.py")
        print("   2. The system will now use Qwen 2.5 for jersey number detection")
        print("   3. Qwen 2.5 can read numbers from front or back of jerseys")
        
        # Test import
        print("\n🧪 Testing imports...")
        try:
            from transformers import Qwen2VLForConditionalGeneration
            print("   ✅ Qwen 2.5 model import successful")
        except ImportError as e:
            print(f"   ⚠️ Qwen 2.5 import failed: {e}")
            print("   💡 You may need to install additional dependencies")
        
        try:
            import torch
            print(f"   ✅ PyTorch {torch.__version__} available")
            if torch.cuda.is_available():
                print(f"   🚀 CUDA available with {torch.cuda.device_count()} GPU(s)")
            else:
                print("   💻 Running on CPU (slower but functional)")
        except ImportError:
            print("   ❌ PyTorch not available")
            
    else:
        print(f"⚠️ {len(packages) - success_count} packages failed to install")
        print("💡 Try running: pip install -r requirements.txt")
    
    print("\n🏈 Ready to detect jersey numbers with AI!")

if __name__ == "__main__":
    main()
