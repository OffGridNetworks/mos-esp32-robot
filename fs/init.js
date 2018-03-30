load('api_config.js');
load('api_arduino_ssd1306.js');
load('api_timer.js');
load('api_sys.js');
load('api_net.js');
load('api_config.js');
load('api_gpio.js');
load('api_pwm.js');
load('api_blynk.js');

let evs = '???';
let status = "OK";

// FFI Wrappers
Adafruit_SSD1306._spl = ffi('void ssd1306_splash(void *, void *)');
Adafruit_SSD1306._proto.splash = function (data) { Adafruit_SSD1306._spl(this.ssd, data); };
Adafruit_SSD1306._dbm = ffi('void ssd1306_drawBitmap(void *, void *, int, int, int, int)');
Adafruit_SSD1306._proto.drawBitmap = function (data, x, y, w, h) { Adafruit_SSD1306._dbm(this.ssd, data, x, y, w, h); };
let free = ffi('void free(void *)');

// Polyfills
let atob = atob || function (str) { return ffi('void *atob(void *, int)')(str, str.length); };

// Display 
let d = Adafruit_SSD1306.create_i2c(Cfg.get('app.ssd1306_reset_pin'), Adafruit_SSD1306.RES_128_64);
d.begin(Adafruit_SSD1306.SWITCHCAPVCC, 0x3C, true);

let logo = atob("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAAAAfAAAAAAAAAAAAAAAAAAAAPwAAAAAAAAAAAAAAAAAAAH4AAAAAAAAAAAAAAAAAAAD+AAAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAA/4AAAAAAAAAAAAAAAAAAAP8AAAAAAAA7gAQGAAAAAAD/AAAAAAAANgAABgAAAAA//wAAAAAAHn8+fH4AAAAA//4AAAAAADN2ZvTOAAAAA//+AAAAAAAhtsbFhgAAAB///wAAAAAAYbbCxYYAAAA///+AAAAAAGG2wsWGAAAAH///wAAAAAAhtsbFhgAAAAMAP+AAAAAAMzZuxM4AAAAAAB/wAAAAAB82PsT+AAAAAAAH+AAAAAAAAEIAAAAAAAAAB/wAAAAAAABmAAAAAAAAAAP8AAAAAAAAPAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAf8AAAAAAAAAAAAAAAAAAAH/gAAAAAAAAAAAAAAAAAAA/4AAAAAAAAAAAAAAAAAAAP/AAAAAgAAAYAAAAAAAAAD/wAAAAYAAAGAAAAAAAAAA/+AA/HvxiefjeAAAAAAAAH/gAO7dkZs35swAAAAAAAB/4ADHjZueFmzEAAAAAAAAf/AAx/2b1h54eAAAAAAAAH/wAMf9ivYefDwAAAAAAAB/8ADHhY52HmbGAAAAAAAAf/AAxs2OYzZjxgAAAAAAAB/wAMb4xmPmY3wAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgBACAAAAAAAAAAAAAAAAD/n/P+P8AAAAAAAAAAAAAB///////gAAAAAAAAAAAAAf//////4AAAAAAAAAAAAAHj/H/P+eAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==");
let logo2 = atob("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAeAAAAAAAAAD4AAAAAAAAAfgAAAAAAAAD8AAAAAAAAAfwAAAAAAAAB/AAAAAAAAAP4AAAAAAAAB/gAAAAAAAAP+AAAAAAAAAf4AAAAAAAB//AAAAAAAA//8AAAAAAAP//wAAAAAAD///AAAAAAAf//+AAAAAAB///8AAAAAAAYA/4AAAAAAAAA/wAAAAAAAAB/gAAAAAAAAD/AAAAAAAAAH+AAAAAAAAAf8AAAAAAAAA/4AAAAAAAAD/gAAAAAAAAP/AAAAAAAAAf8AAAAAAAAB/4AAAAAAAAH/gAAAAAAAAf/AAAAAAAAB/8AAAAAAAAD/wAAAAAAAAP/gAAAAAAAA/+AAAAAAAAD/4AAAAAAAAD/gAAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAAQAgBACAAAAf8/5/z/gAAD///////AAAP//////8AAA8f4/x/jwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=");
let wifi_logo = atob("AAAAAAAAB+AcODAOB/AMGAHAA+AAAACAAYAAAAAAAAA=");
let mqtt_logo = atob("AAAAAAAAAAAAAAwYGjwxxiHCMcYeLAwYAAAAAAAAAAA=");
let mqtt_error = true;

let wifi_connected = false;
let wifi_connecting = false;

// Main
function main() {
  d.clearDisplay();
  d.drawBitmap(logo2, 0, 0, 64, 64);
  d.setTextColor(Adafruit_SSD1306.WHITE);
  d.setTextSize(2);
  d.setCursor(65, 30)
  d.write(status);
  d.setTextSize(1);

  if (evs === "CONNECTED") {
    d.drawBitmap(wifi_logo, 128 - 16, 0, 16, 16);
  }

  if (evs === "CONNECTING") {
    d.drawBitmap(mqtt_logo, 128 - 16, 0, 16, 16);
  }

  d.display();
}

// Init
function init() {
  d.clearDisplay();
  d.splash(logo);
  d.display();
  Timer.set(1000, true, main, null);
}

init();


let LED = 25;

//Stepper motor blynk
let V_ASPEED = 0; //virtual pin
let V_BSPEED = 1; //virtual pin
let V_AFORWARD = 2; //virtual pin
let V_BFORWARD = 3; //virtual pin
let V_AREVERSE = 4; //virtual pin
let V_BREVERSE = 5; //virtual pin

//Stepper Motor Pin Variables
let motor_a_enable_pin = 21; //ENA
let motor_a_forward_pin = 13; //N1
let motor_a_reverse_pin = 12; //N2
let motor_b_enable_pin = 22; //ENB
let motor_b_forward_pin = 14; //N3
let motor_b_reverse_pin = 27; //N4

//PROG
let Motor = {

  init: function () {

    //Setup pins as output
    GPIO.set_mode(motor_a_enable_pin, GPIO.MODE_OUTPUT);
    GPIO.set_mode(motor_a_forward_pin, GPIO.MODE_OUTPUT);
    GPIO.set_mode(motor_a_reverse_pin, GPIO.MODE_OUTPUT);
    GPIO.set_mode(motor_b_enable_pin, GPIO.MODE_OUTPUT);
    GPIO.set_mode(motor_b_forward_pin, GPIO.MODE_OUTPUT);
    GPIO.set_mode(motor_b_reverse_pin, GPIO.MODE_OUTPUT);

    //Stop
    //  Motor.stopA();
    //  Motor.stopB();
  },

  forwardA: function () {
    GPIO.write(motor_a_forward_pin, 1);
    GPIO.write(motor_a_reverse_pin, 0);
    PWM.set(motor_a_enable_pin, 500, 0.5);
  },

  reverseA: function () {
    GPIO.write(motor_a_forward_pin, 0);
    GPIO.write(motor_a_reverse_pin, 1);
    PWM.set(motor_a_enable_pin, 500, 0.5);
  },

  reverseA: function () {
    GPIO.write(motor_a_forward_pin, 1);
    GPIO.write(motor_a_reverse_pin, 0);
    PWM.set(motor_a_enable_pin, 500, 0.5);
  },

  reverseA: function () {
    GPIO.write(motor_a_forward_pin, 0);
    GPIO.write(motor_a_reverse_pin, 1);
    PWM.set(motor_a_enable_pin, 500, 0.5);
  },

  stopA: function () {
    GPIO.write(motor_a_forward_pin, 0);
    GPIO.write(motor_a_reverse_pin, 0);
    PWM.set(motor_a_enable_pin, 0, 0.5);
  },

  stopB: function () {
    GPIO.write(motor_b_enable_pin, 0);
    GPIO.write(motor_b_forward_pin, 0);
    PWM.set(motor_b_enable_pin, 0, 0.5);
  },
};

Motor.init();
print("motor ok")

// Blink built-in LED every second
GPIO.set_mode(LED, GPIO.MODE_OUTPUT);
Timer.set(1000, true, function () {
  GPIO.toggle(LED);
}, null);

//Motor Control
Blynk.setHandler(function (conn, cmd, pin, val, id) {
  let ram = Sys.free_ram() / 1024;
  if (cmd === 'vr') {
    Blynk.virtualWrite(conn, pin, ram, id);
  } else if (cmd === 'vw') {
    if (pin === V_ASPEED) {
      if (val > 500) { PWM.set(motor_a_enable_pin, 490, val/1000); }
      else {
        PWM.set(motor_a_enable_pin, 0, 0);
      }
      status = "A " + JSON.stringify(val);
    } else if (pin === V_BSPEED) {
      if (val > 500) { PWM.set(motor_b_enable_pin, 490, val/1000); }
      else { PWM.set(motor_b_enable_pin, 0, 0); }
      status = "B " + JSON.stringify(val);
    }
    else if (pin === V_AFORWARD) {
      GPIO.write(motor_a_forward_pin, val);
      status = "A FORWARD";
    }
    else if (pin === V_AREVERSE) {
      GPIO.write(motor_a_reverse_pin, val);
      status = "A REVERSE";
    }
    else if (pin === V_BFORWARD) {
      GPIO.write(motor_b_forward_pin, val);
      status = "B FORWARD";
    }
    else if (pin === V_BREVERSE) {
      GPIO.write(motor_b_reverse_pin, val);
      status = "B REVERSE";
    }
  }
  print('BLYNK JS handler, ram', ram, cmd, id, pin, val);
  wifi_connected = true;
  main();

}, null);