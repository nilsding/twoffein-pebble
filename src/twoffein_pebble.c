/* twoffein_pebble
 * Copyright (c) 2014  nilsding <nilsding@nilsding.org>
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#include <pebble.h>

/* much doge such wow */
#define loge(x) app_log(APP_LOG_LEVEL_INFO, "twoffein_pebble.c", 0, x)
#define BUFSIZE 64
/* appkeys */
#define SELECT 0
#define STR_CHANGE_UP 1
#define STR_CHANGE_SELECT 2
#define STR_CHANGE_DOWN 3
/* keys for persistent storage */
#define KEY_DRINK_UP_STR 1
#define KEY_DRINK_SELECT_STR 2
#define KEY_DRINK_DOWN_STR 3
/* default values */
#define DEFAULT_DRINK_UP_STR "Kaffee"
#define DEFAULT_DRINK_SELECT_STR "Eistee"
#define DEFAULT_DRINK_DOWN_STR "Energie Drink"

/* global structures */

static Window *window;
static TextLayer *text_layer_top;
static TextLayer *text_layer_center;
static TextLayer *text_layer_bottom;

static char str_drink_up[BUFSIZE];
static char str_drink_select[BUFSIZE];
static char str_drink_down[BUFSIZE];

/* function prototypes */

void out_sent_handler(DictionaryIterator *sent, void *context);
void out_failed_handler(DictionaryIterator *failed, AppMessageResult reason, void *context);
void in_received_handler(DictionaryIterator *iter, void *context);
void in_dropped_handler(AppMessageResult reason, void *context);
void interpret_result(AppMessageResult reason);
static void select_click_handler(ClickRecognizerRef recognizer, void *context);
static void up_click_handler(ClickRecognizerRef recognizer, void *context);
static void down_click_handler(ClickRecognizerRef recognizer, void *context);
static void click_config_provider(void *context);
static void window_load(Window *window);
static void window_unload(Window *window);
static void init(void);
static void deinit(void);

/* code logic starts here */

int main(void) {
    init();

    app_event_loop();

    deinit();
}

void out_sent_handler(DictionaryIterator *sent, void *context) {
}

void out_failed_handler(DictionaryIterator *failed, AppMessageResult reason, void *context) {
    interpret_result(reason);
}

void in_received_handler(DictionaryIterator *iter, void *context) {
    /* get data */
    Tuple *t = dict_read_first(iter);
    while (t) {
        int key = t->key;
        
        char tmp[BUFSIZE] = "";
        strncpy(tmp, t->value->cstring, BUFSIZE);
        
        switch (key) {
            case STR_CHANGE_UP:
                strncpy(str_drink_up, tmp, BUFSIZE);
                text_layer_set_text(text_layer_top, str_drink_up);
                break;
            case STR_CHANGE_SELECT:
                strncpy(str_drink_select, tmp, BUFSIZE);
                text_layer_set_text(text_layer_center, str_drink_select);
                break;
            case STR_CHANGE_DOWN:
                strncpy(str_drink_down, tmp, BUFSIZE);
                text_layer_set_text(text_layer_bottom, str_drink_down);
                break;
        }
        
        /* get even more data */
        t = dict_read_next(iter);
    }
}

void in_dropped_handler(AppMessageResult reason, void *context) {
    interpret_result(reason);
}

void interpret_result(AppMessageResult reason) {
    switch (reason) {
        case APP_MSG_OK:
            loge("APP_MSG_OK");
            break;
        case APP_MSG_SEND_TIMEOUT:
            loge("APP_MSG_SEND_TIMEOUT");
            break;
        case APP_MSG_SEND_REJECTED:
            loge("APP_MSG_SEND_REJECTED");
            break;
        case APP_MSG_NOT_CONNECTED:
            loge("APP_MSG_NOT_CONNECTED");
            break;
        case APP_MSG_APP_NOT_RUNNING:
            loge("APP_MSG_APP_NOT_RUNNING");
            break;
        case APP_MSG_INVALID_ARGS:
            loge("APP_MSG_INVALID_ARGS");
            break;
        case APP_MSG_BUSY:
            loge("APP_MSG_BUSY");
            break;
        case APP_MSG_BUFFER_OVERFLOW:
            loge("APP_MSG_BUFFER_OVERFLOW");
            break;
        case APP_MSG_ALREADY_RELEASED:
            loge("APP_MSG_ALREADY_RELEASED");
            break;
        case APP_MSG_CALLBACK_ALREADY_REGISTERED:
            loge("APP_MSG_CALLBACK_ALREADY_REGISTERED");
            break;
        case APP_MSG_CALLBACK_NOT_REGISTERED:
            loge("APP_MSG_CALLBACK_NOT_REGISTERED");
            break;
        case APP_MSG_OUT_OF_MEMORY:
            loge("APP_MSG_OUT_OF_MEMORY");
            break;
        default:
            loge("???");
    }
}

static void up_click_handler(ClickRecognizerRef recognizer, void *context) {
    DictionaryIterator *iter;
    app_message_outbox_begin(&iter);
    
    Tuplet value = TupletInteger(SELECT, STR_CHANGE_UP);
    dict_write_tuplet(iter, &value);
    
    app_message_outbox_send();
}

static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
    DictionaryIterator *iter;
    app_message_outbox_begin(&iter);
    
    Tuplet value = TupletInteger(SELECT, STR_CHANGE_SELECT);
    dict_write_tuplet(iter, &value);
    
    app_message_outbox_send();
}

static void down_click_handler(ClickRecognizerRef recognizer, void *context) {
    DictionaryIterator *iter;
    app_message_outbox_begin(&iter);
    
    Tuplet value = TupletInteger(SELECT, STR_CHANGE_DOWN);
    dict_write_tuplet(iter, &value);
    
    app_message_outbox_send();
}

static void click_config_provider(void *context) {
    window_single_click_subscribe(BUTTON_ID_UP, up_click_handler);
    window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
    window_single_click_subscribe(BUTTON_ID_DOWN, down_click_handler);
}

static void window_load(Window *window) {
    Layer *window_layer = window_get_root_layer(window);
    GRect bounds = layer_get_bounds(window_layer);
    
    text_layer_top = text_layer_create((GRect) { .origin = { 0, 9 }, .size = { bounds.size.w, 20 } });
    text_layer_center = text_layer_create((GRect) { .origin = { 0, 73 }, .size = { bounds.size.w, 20 } });
    text_layer_bottom = text_layer_create((GRect) { .origin = { 0, 134 }, .size = { bounds.size.w, 20 } });
    text_layer_set_text(text_layer_top, str_drink_up);
    text_layer_set_text(text_layer_center, str_drink_select);
    text_layer_set_text(text_layer_bottom, str_drink_down);
    text_layer_set_text_alignment(text_layer_top, GTextAlignmentCenter);
    text_layer_set_text_alignment(text_layer_center, GTextAlignmentCenter);
    text_layer_set_text_alignment(text_layer_bottom, GTextAlignmentCenter);
    layer_add_child(window_layer, text_layer_get_layer(text_layer_top));
    layer_add_child(window_layer, text_layer_get_layer(text_layer_center));
    layer_add_child(window_layer, text_layer_get_layer(text_layer_bottom));
}

static void window_unload(Window *window) {
    text_layer_destroy(text_layer_top);
    text_layer_destroy(text_layer_center);
    text_layer_destroy(text_layer_bottom);
}

static void init(void) {
    /* create a window */
    window = window_create();
    window_set_click_config_provider(window, click_config_provider);
    window_set_window_handlers(window, (WindowHandlers) {
        .load = window_load,
        .unload = window_unload,
    });
    
    /* set up AppMessage */
    app_message_register_inbox_received(in_received_handler);
    app_message_register_inbox_dropped(in_dropped_handler);
    app_message_register_outbox_sent(out_sent_handler);
    app_message_register_outbox_failed(out_failed_handler);
    
    const uint32_t inbound_size = 256;
    const uint32_t outbound_size = BUFSIZE;
    app_message_open(inbound_size, outbound_size);
    
    /* set up persistent storage */
    if (persist_exists(KEY_DRINK_UP_STR)) {
        persist_read_string(KEY_DRINK_UP_STR, str_drink_up, BUFSIZE);
    } else {
        strncpy(str_drink_up, DEFAULT_DRINK_UP_STR, BUFSIZE);
    }
    if (persist_exists(KEY_DRINK_SELECT_STR)) {
        persist_read_string(KEY_DRINK_SELECT_STR, str_drink_select, BUFSIZE);
    } else {
        strncpy(str_drink_select, DEFAULT_DRINK_SELECT_STR, BUFSIZE);
    }
    if (persist_exists(KEY_DRINK_DOWN_STR)) {
        persist_read_string(KEY_DRINK_DOWN_STR, str_drink_down, BUFSIZE);
    } else {
        strncpy(str_drink_down, DEFAULT_DRINK_DOWN_STR, BUFSIZE);
    }
    
    /* push the created window onto the window stack */
    window_stack_push(window, true /* animated */);
}

static void deinit(void) {
    /* save the names of the drinks into the persistent storage, as the
       JavaScript part is be responsible for handling drinks */
    persist_write_string(KEY_DRINK_UP_STR, str_drink_up);
    persist_write_string(KEY_DRINK_SELECT_STR, str_drink_select);
    persist_write_string(KEY_DRINK_DOWN_STR, str_drink_down);
    
    window_destroy(window);
}

