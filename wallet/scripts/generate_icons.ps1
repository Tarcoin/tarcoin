# =============================================================================
# generate_icons.ps1 — Generate Android and iOS icon sets from master logo
# =============================================================================

Add-Type -AssemblyName System.Drawing

$sourcePath = "d:\TARCOIN\website\public\tarcoin-logo.png"
$assetsDir = "d:\TARCOIN\wallet\assets"

$androidDir = "$assetsDir\android"
$iosDir = "$assetsDir\ios"

# Create output directories
New-Item -ItemType Directory -Force -Path $androidDir | Out-Null
New-Item -ItemType Directory -Force -Path $iosDir | Out-Null

$img = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image {
    param (
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$OutputPath
    )
    $dest = New-Object System.Drawing.Bitmap($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($dest)
    
    # High quality scaling
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.DrawImage($Image, 0, 0, $Width, $Height)
    $g.Dispose()
    
    $dest.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dest.Dispose()
}

# ---------------------------------------------------------------------------
# Android Launcher Icons
# ---------------------------------------------------------------------------
$androidSizes = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

Write-Output "Generating Android icons..."
foreach ($key in $androidSizes.Keys) {
    $size = $androidSizes[$key]
    $dir = "$androidDir\$key"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    
    # Save standard and round launcher icons
    Resize-Image -Image $img -Width $size -Height $size -OutputPath "$dir\ic_launcher.png"
    Resize-Image -Image $img -Width $size -Height $size -OutputPath "$dir\ic_launcher_round.png"
}

# ---------------------------------------------------------------------------
# iOS Icons (Asset Catalog format)
# ---------------------------------------------------------------------------
$iosSizes = @(
    @{ name = "icon-20.png"; size = 20 }
    @{ name = "icon-20@2x.png"; size = 40 }
    @{ name = "icon-20@3x.png"; size = 60 }
    @{ name = "icon-29.png"; size = 29 }
    @{ name = "icon-29@2x.png"; size = 58 }
    @{ name = "icon-29@3x.png"; size = 87 }
    @{ name = "icon-40.png"; size = 40 }
    @{ name = "icon-40@2x.png"; size = 80 }
    @{ name = "icon-40@3x.png"; size = 120 }
    @{ name = "icon-60@2x.png"; size = 120 }
    @{ name = "icon-60@3x.png"; size = 180 }
    @{ name = "icon-76.png"; size = 76 }
    @{ name = "icon-76@2x.png"; size = 152 }
    @{ name = "icon-83.5@2x.png"; size = 167 }
    @{ name = "icon-1024.png"; size = 1024 }
)

Write-Output "Generating iOS AppIcon assets..."
foreach ($item in $iosSizes) {
    Resize-Image -Image $img -Width $item.size -Height $item.size -OutputPath "$iosDir\$($item.name)"
}

# ---------------------------------------------------------------------------
# Contents.json for iOS Asset Catalog
# ---------------------------------------------------------------------------
$contentsJson = @'
{
  "images" : [
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "icon-20@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "icon-20@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "icon-29.png",
      "scale" : "1x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "icon-29@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "icon-29@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "icon-40@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "icon-40@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "icon-60@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "icon-60@3x.png",
      "scale" : "3x"
    },
    {
      "size" : "20x20",
      "idiom" : "ipad",
      "filename" : "icon-20.png",
      "scale" : "1x"
    },
    {
      "size" : "20x20",
      "idiom" : "ipad",
      "filename" : "icon-20@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "29x29",
      "idiom" : "ipad",
      "filename" : "icon-29.png",
      "scale" : "1x"
    },
    {
      "size" : "29x29",
      "idiom" : "ipad",
      "filename" : "icon-29@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "40x40",
      "idiom" : "ipad",
      "filename" : "icon-40.png",
      "scale" : "1x"
    },
    {
      "size" : "40x40",
      "idiom" : "ipad",
      "filename" : "icon-40@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "76x76",
      "idiom" : "ipad",
      "filename" : "icon-76.png",
      "scale" : "1x"
    },
    {
      "size" : "76x76",
      "idiom" : "ipad",
      "filename" : "icon-76@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "83.5x83.5",
      "idiom" : "ipad",
      "filename" : "icon-83.5@2x.png",
      "scale" : "2x"
    },
    {
      "size" : "1024x1024",
      "idiom" : "ios-marketing",
      "filename" : "icon-1024.png",
      "scale" : "1x"
    }
  ],
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
}
'@

$contentsJson | Out-File -FilePath "$iosDir\Contents.json" -Encoding utf8

$img.Dispose()
Write-Output "Successfully generated all icons!"
