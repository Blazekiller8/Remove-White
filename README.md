# Remove-White

Typescript program using the sharp and canvas library to read the image, determine if an image is blank/white (if the area of the non-white region is less than 15X15 px), if not, remove any white regions near the edges of the image due to cropping mistakes. A white pixel is defined as being within 5 px far from any of the edges, then all white pixels connected to it are 'white regions near the edges'. All of such white regions should be considered as cropping mistakes and should be completely removed from the image.

## Note:

This program is still in development, and won't work for images enclosed in a non-white coloured border.
