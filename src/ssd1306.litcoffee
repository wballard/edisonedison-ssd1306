Ahh -- and here we have a driver. There options:
* the I2C Device, which I'll default to `/dev/i2c-1`
* the I2C Address, which I'll default to `0x3c` to match my display
* the screen size, which I'll default to 128x64 *moar pixels!*

    i2c = require 'i2c'
    AdafruitGFX = require './Adafruit_GFX'

I'm not usually one for classes, but well, it's hard to argue that a
display isn't an object. So, I won't.

    module.exports = class SSD1306 extends AdafruitGFX

      constructor: (@device='/dev/i2c-1', @address=0x3c, @width=128, @height=64) ->
        super @width, @height
        @buffer = []
        while @buffer.length < @width*@height/8
          @buffer.push 0x00
        @wire = new i2c @address, device: @device
        @control @DISPLAYOFF
        @control @SETDISPLAYCLOCKDIV
        @control 0x80 #the suggested ratio 0x80
        @control @SETMULTIPLEX
        @control 0x3F
        #no offset
        @control @SETDISPLAYOFFSET
        @control 0x0
        @control @SETSTARTLINE | 0x0
        @control @CHARGEPUMP
        @control 0x14
        @control @MEMORYMODE
        @control 0x00
        @control @SEGREMAP | 0x1
        @control @COMSCANDEC
        @control @SETCOMPINS
        @control 0x12
        @control @SETCONTRAST
        @control 0xCF
        @control @SETPRECHARGE
        @control 0xF1
        @control @SETVCOMDETECT
        @control 0x40
        @control @DEACTIVATE_SCROLL
        @control @DISPLAYALLON_RESUME
        @control @NORMALDISPLAY
        @control @DISPLAYON

        @clear()
        @display()

There are a bunch of magic number commands, so a constants section.

      SETCONTRAST: 0x81
      DISPLAYALLON_RESUME: 0xA4
      DISPLAYALLON: 0xA5
      NORMALDISPLAY: 0xA6
      INVERTDISPLAY: 0xA7
      DISPLAYOFF: 0xAE
      DISPLAYON: 0xAF
      SETDISPLAYOFFSET: 0xD3
      SETCOMPINS: 0xDA
      SETVCOMDETECT: 0xDB
      SETDISPLAYCLOCKDIV: 0xD5
      SETPRECHARGE: 0xD9
      SETMULTIPLEX: 0xA8
      SETLOWCOLUMN: 0x00
      SETHIGHCOLUMN: 0x10
      SETSTARTLINE: 0x40
      MEMORYMODE: 0x20
      COLUMNADDR: 0x21
      PAGEADDR: 0x22
      COMSCANINC: 0xC0
      COMSCANDEC: 0xC8
      SEGREMAP: 0xA0
      CHARGEPUMP: 0x8D
      EXTERNALVCC: 0x1
      SWITCHCAPVCC: 0x2
      ACTIVATE_SCROLL: 0x2F
      DEACTIVATE_SCROLL: 0x2E
      SET_VERTICAL_SCROLL_AREA: 0xA3
      RIGHT_HORIZONTAL_SCROLL: 0x26
      LEFT_HORIZONTAL_SCROLL: 0x27
      VERTICAL_AND_RIGHT_HORIZONTAL_SCROLL: 0x29
      VERTICAL_AND_LEFT_HORIZONTAL_SCROLL: 0x2A
      BLACK: 0
      WHITE: 1

Control escapes.

      control: (cmd, callback=->) ->
        @wire.writeBytes 0x00, [cmd], callback

      invert: ->
        @control @INVERTDISPLAY

      normal: ->
        @control @NORMALDISPLAY

This display is an in memory buffer that flushes to the device.

      display: ->
        @control @COLUMNADDR
        @control 0
        @control 127
        @control @PAGEADDR
        @control 0
        if @height is 64
          @control 7
        else
          @control 3
        i = 0
        while i < @buffer.length
          @wire.writeBytes 0x40, @buffer.slice(i, i+16), ->
          i+=16

      clear: ->
        for byte, i in @buffer
          @buffer[i] = 0x00

      solid: ->
        for byte, i in @buffer
          @buffer[i] = 0xFF

      drawPixel: (x, y, color=@WHITE) ->
        if color
          @buffer[x+ (y/8>>0)*@width] |= (1 << (y&7))
        else
          @buffer[x+ (y/8>>0)*@width] &= ~(1 << (y&7))

The basic print method, display text, replacing all text.

      print: (text) ->
        @setCursor 0, 0
        for c in text
          @write c.charCodeAt(0)
