/*
This is the core graphics library for all our displays, providing a common
set of graphics primitives (points, lines, circles, etc.).  It needs to be
paired with a hardware-specific library for each display device we carry
(to handle the lower-level functions).

Adafruit invests time and resources providing this open source code, please
support Adafruit & open-source hardware by purchasing products from Adafruit!

Copyright (c) 2013 Adafruit Industries.  All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

- Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.
- Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
*/

var font = require('./glcdfont.js');


var Adafruit_GFX = function(width, height){
  var that = this;
  var _width    = width;
  var _height   = height;
  var rotation  = 0;
  var cursor_y  = cursor_x    = 0;
  var textsize  = 1;
  var textcolor = textbgcolor = 0xFFFF;
  var wrap      = true;


// Draw a circle outline
Adafruit_GFX.prototype.drawCircle = function(x0, y0, r, color) {
  var f = 1 - r;
  var ddF_x = 1;
  var ddF_y = -2 * r;
  var x = 0;
  var y = r;

  this.drawPixel(x0  , y0+r, color);
  this.drawPixel(x0  , y0-r, color);
  this.drawPixel(x0+r, y0  , color);
  this.drawPixel(x0-r, y0  , color);

  while (x<y) {
    if (f >= 0) {
      y--;
      ddF_y += 2;
      f += ddF_y;
    }
    x++;
    ddF_x += 2;
    f += ddF_x;

    this.drawPixel(x0 + x, y0 + y, color);
    this.drawPixel(x0 - x, y0 + y, color);
    this.drawPixel(x0 + x, y0 - y, color);
    this.drawPixel(x0 - x, y0 - y, color);
    this.drawPixel(x0 + y, y0 + x, color);
    this.drawPixel(x0 - y, y0 + x, color);
    this.drawPixel(x0 + y, y0 - x, color);
    this.drawPixel(x0 - y, y0 - x, color);
  }
};

Adafruit_GFX.prototype.drawCircleHelper = function( x0, y0, r, cornername, color) {
  var f = 1 - r;
  var ddF_x = 1;
  var ddF_y = -2 * r;
  var x = 0;
  var y  = r;

  while (x<y) {
    if (f >= 0) {
      y--;
      ddF_y += 2;
      f     += ddF_y;
    }
    x++;
    ddF_x += 2;
    f     += ddF_x;
    if (cornername & 0x4) {
      this.drawPixel(x0 + x, y0 + y, color);
      this.drawPixel(x0 + y, y0 + x, color);
    }
    if (cornername & 0x2) {
      this.drawPixel(x0 + x, y0 - y, color);
      this.drawPixel(x0 + y, y0 - x, color);
    }
    if (cornername & 0x8) {
      this.drawPixel(x0 - y, y0 + x, color);
      this.drawPixel(x0 - x, y0 + y, color);
    }
    if (cornername & 0x1) {
      this.drawPixel(x0 - y, y0 - x, color);
      this.drawPixel(x0 - x, y0 - y, color);
    }
  }
};



Adafruit_GFX.prototype.fillCircle = function(x0, y0, r, color) {
  this.drawFastVLine(x0, y0-r, 2*r+1, color);
  this.fillCircleHelper(x0, y0, r, 3, 0, color);
};

// Used to do circles and roundrects
Adafruit_GFX.prototype.fillCircleHelper = function(x0, y0, r, cornername, delta, color) {

  var f     = 1 - r;
  var ddF_x = 1;
  var ddF_y = -2 * r;
  var x     = 0;
  var y     = r;

  while (x<y) {
    if (f >= 0) {
      y--;
      ddF_y += 2;
      f     += ddF_y;
    }
    x++;
    ddF_x += 2;
    f     += ddF_x;

    if (cornername & 0x1) {
      this.drawFastVLine(x0+x, y0-y, 2*y+1+delta, color);
      this.drawFastVLine(x0+y, y0-x, 2*x+1+delta, color);
    }
    if (cornername & 0x2) {
      this.drawFastVLine(x0-x, y0-y, 2*y+1+delta, color);
      this.drawFastVLine(x0-y, y0-x, 2*x+1+delta, color);
    }
  }
};

// Bresenham's algorithm - thx wikpedia
Adafruit_GFX.prototype.drawLine = function(x0, y0, x1, y1, color) {
  var steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
  if (steep) {
    x0 = [y0, y0 = x0][0];//swap(x0, y0);
    x1 = [y1, y1 = x1][0];//swap(x1, y1);
  }

  if (x0 > x1) {
    x0 = [x1, x1 = x0][0];//swap(x0, x1);
    y0 = [y1, y1 = y0][0];//swap(y0, y1);
  }

  var dx, dy;
  dx = x1 - x0;
  dy = Math.abs(y1 - y0);


  var err = dx / 2;
  var ystep;

  if (y0 < y1) {
    ystep = 1;
  } else {
    ystep = -1;
  }

  for (; x0<=x1; x0++) {
    if (steep) {
      this.drawPixel(y0, x0, color);
    } else {
      this.drawPixel(x0, y0, color);
    }
    err -= dy;
    if (err < 0) {
      y0 += ystep;
      err += dx;
    }
  }
};

// Draw a rectangle
Adafruit_GFX.prototype.drawRect = function(x, y, w, h, color) {
  this.drawFastHLine(x, y, w, color);
  this.drawFastHLine(x, y+h-1, w, color);
  this.drawFastVLine(x, y, h, color);
  this.drawFastVLine(x+w-1, y, h, color);
};

Adafruit_GFX.prototype.drawFastVLine = function(x, y, h, color) {
  // Update in subclasses if desired!
  this.drawLine(x, y, x, y+h-1, color);
};

Adafruit_GFX.prototype.drawFastHLine = function(x, y, w, color) {
  // Update in subclasses if desired!
  this.drawLine(x, y, x+w-1, y, color);
};

Adafruit_GFX.prototype.fillRect = function(x, y, w, h, color) {
  // Update in subclasses if desired!
  for (var i=x; i<x+w; i++) {
    this.drawFastVLine(i, y, h, color);
  }
};

Adafruit_GFX.prototype.fillScreen = function(color) {
  this.fillRect(0, 0, _width, _height, color);
};

// Draw a rounded rectangle
Adafruit_GFX.prototype.drawRoundRect = function(x, y, w, h, r, color) {
  // smarter version
  this.drawFastHLine(x+r  , y    , w-2*r, color); // Top
  this.drawFastHLine(x+r  , y+h-1, w-2*r, color); // Bottom
  this.drawFastVLine(x    , y+r  , h-2*r, color); // Left
  this.drawFastVLine(x+w-1, y+r  , h-2*r, color); // Right
  // draw four corners
  this.drawCircleHelper(x+r    , y+r    , r, 1, color);
  this.drawCircleHelper(x+w-r-1, y+r    , r, 2, color);
  this.drawCircleHelper(x+w-r-1, y+h-r-1, r, 4, color);
  this.drawCircleHelper(x+r    , y+h-r-1, r, 8, color);
};

// Fill a rounded rectangle
Adafruit_GFX.prototype.fillRoundRect = function(x, y, w, h, r, color) {
  // smarter version
  this.fillRect(x+r, y, w-2*r, h, color);

  // draw four corners
  this.fillCircleHelper(x+w-r-1, y+r, r, 1, h-2*r-1, color);
  this.fillCircleHelper(x+r    , y+r, r, 2, h-2*r-1, color);
};

// Draw a triangle
Adafruit_GFX.prototype.drawTriangle = function(x0, y0, x1, y1, x2, y2, color) {
  this.drawLine(x0, y0, x1, y1, color);
  this.drawLine(x1, y1, x2, y2, color);
  this.drawLine(x2, y2, x0, y0, color);
};

// Fill a triangle
Adafruit_GFX.prototype.fillTriangle = function( x0, y0, x1, y1, x2, y2, color) {

  var a, b, y, last;

  // Sort coordinates by Y order (y2 >= y1 >= y0)
  if (y0 > y1) {
    y0 = [y1, y1 = y0][0];//swap(y0, y1);
	x0 = [x1, x1 = x0][0];//swap(x0, x1);
  }
  if (y1 > y2) {
    y2 = [y1, y1 = y2][0];//swap(y2, y1);
	x2 = [x1, x1 = x2][0];//swap(x2, x1);
  }
  if (y0 > y1) {
    y0 = [y1, y1 = y0][0];//swap(y0, y1);
	x0 = [x1, x1 = x0][0];//swap(x0, x1);
  }

  if(y0 == y2) { // Handle awkward all-on-same-line case as its own thing
    a = b = x0;
    if(x1 < a) {
      a = x1;
	} else if(x1 > b) {
    b = x1;
	}
    if(x2 < a) {
      a = x2;
	}
    else if(x2 > b) {
      b = x2;
	}
    this.drawFastHLine(a, y0, b-a+1, color);
    return;
  }

  var dx01 = x1 - x0,
    dy01 = y1 - y0,
    dx02 = x2 - x0,
    dy02 = y2 - y0,
    dx12 = x2 - x1,
    dy12 = y2 - y1,
    sa   = 0,
    sb   = 0;

  // For upper part of triangle, find scanline crossings for segments
  // 0-1 and 0-2.  If y1=y2 (flat-bottomed triangle), the scanline y1
  // is included here (and second loop will be skipped, avoiding a /0
  // error there), otherwise scanline y1 is skipped here and handled
  // in the second loop...which also avoids a /0 error here if y0=y1
  // (flat-topped triangle).
  if(y1 == y2) {
    last = y1;   // Include y1 scanline
  }
  else {
    last = y1-1; // Skip it
  }

  for(y=y0; y<=last; y++) {
    a   = x0 + sa / dy01;
    b   = x0 + sb / dy02;
    sa += dx01;
    sb += dx02;
    /* longhand:
    a = x0 + (x1 - x0) * (y - y0) / (y1 - y0);
    b = x0 + (x2 - x0) * (y - y0) / (y2 - y0);
    */
    if(a > b){
		a = [b, b = a][0];//swap(a,b);
	}
    this.drawFastHLine(a, y, b-a+1, color);
  }

  // For lower part of triangle, find scanline crossings for segments
  // 0-2 and 1-2.  This loop is skipped if y1=y2.
  sa = dx12 * (y - y1);
  sb = dx02 * (y - y0);
  for(; y<=y2; y++) {
    a   = x1 + sa / dy12;
    b   = x0 + sb / dy02;
    sa += dx12;
    sb += dx02;
    /* longhand:
    a = x1 + (x2 - x1) * (y - y1) / (y2 - y1);
    b = x0 + (x2 - x0) * (y - y0) / (y2 - y0);
    */
    if(a > b){
		a = [b, b = a][0];//swap(a,b);
	}
    this.drawFastHLine(a, y, b-a+1, color);
  }
};

Adafruit_GFX.prototype.drawBitmap = function(x, y, bitmap, w, h, color) {

  var i, j, byteWidth = (w + 7) / 8;

  for(j=0; j<h; j++) {
    for(i=0; i<w; i++ ) {
      if(pgm_read_byte(bitmap + j * byteWidth + i / 8) & (128 >> (i & 7))) {
	this.drawPixel(x+i, y+j, color);
      }
    }
  }
};

Adafruit_GFX.prototype.write = function(c) {
  if (c == '\n') {
    cursor_y += textsize*8;
    cursor_x  = 0;
  } else if (c == '\r') {
    // skip em
  } else {
    this.drawChar(cursor_x, cursor_y, c, textcolor, textbgcolor, textsize);
    cursor_x += textsize*6;
    if (wrap && (cursor_x > (_width - textsize*6))) {
      cursor_y += textsize*8;
      cursor_x = 0;
    }
  }
};

// Draw a character
Adafruit_GFX.prototype.drawChar = function(x, y, c, color, bg, size) {

  if((x >= _width)            || // Clip right
     (y >= _height)           || // Clip bottom
     ((x + 6 * size - 1) < 0) || // Clip left
     ((y + 8 * size - 1) < 0))   // Clip top
    return;

  for (var i=0; i<6; i++ ) {
    var line;
    if (i == 5)
      line = 0x0;
    else
      line = font[(c*5)+i];
    console.log(c,c*5+i,line,color)
    for (var j = 0; j<8; j++) {
      if (line & 0x1) {
        if (size == 1) // default size
          this.drawPixel(x+i, y+j, color);
        else {  // big size
          this.fillRect(x+(i*size), y+(j*size), size, size, color);
        }
      } else if (bg != color) {
        if (size == 1) // default size
          this.drawPixel(x+i, y+j, bg);
        else {  // big size
          this.fillRect(x+i*size, y+j*size, size, size, bg);
        }
      }
      line = (line >> 1);//line >>= 1;
    }
  }
};

Adafruit_GFX.prototype.setCursor = function(x, y) {
  cursor_x = x;
  cursor_y = y;
};

Adafruit_GFX.prototype.setTextSize = function(s) {
  textsize = (s > 0) ? s : 1;
};

Adafruit_GFX.prototype.setTextColor = function(c) {
  // For 'transparent' background, we'll set the bg
  // to the same as fg instead of using a flag
  textcolor = textbgcolor = c;
};

Adafruit_GFX.prototype.setTextColor = function(c, b) {
  textcolor   = c;
  textbgcolor = b;
};

Adafruit_GFX.prototype.setTextWrap = function(w) {
  wrap = w;
};

Adafruit_GFX.prototype.getRotation = function() {
  return rotation;
};

Adafruit_GFX.prototype.setRotation = function(x) {
  rotation = (x & 3);
  switch(rotation) {
   case 0:
   case 2:
    _width  = WIDTH;
    _height = HEIGHT;
    break;
   case 1:
   case 3:
    _width  = HEIGHT;
    _height = WIDTH;
    break;
  }
};

// Return the size of the display (per current rotation)
Adafruit_GFX.prototype.width = function() {
  return _width;
};

Adafruit_GFX.prototype.height = function() {
  return _height;
};

Adafruit_GFX.prototype.invertDisplay = function(i) {
  // Do nothing, must be subclassed if supported
};
};
module.exports = Adafruit_GFX;
