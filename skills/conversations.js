/*

WHAT IS THIS?

This module demonstrates simple uses of Botkit's conversation system.

In this example, Botkit hears a keyword, then asks a question. Different paths
through the conversation are chosen based on the user's response.

*/

var axios = require('axios');
var cheerio = require('cheerio');

module.exports = function(controller) {
  
    controller.hears(["random"], 'direct_message,direct_mention', function(bot, message) {
      
        bot.startConversation(message, function(err, convo) {
            function randomDate(start, end) {
              var options = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              };

              var d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
              var year = d.getFullYear()
              var month = d.getMonth();
              month = month < 10 ? `0${month}`: month;
              var day = d.getDate();
              day = day < 10 ? `0${day}`: day;
              return `${year}-${month}-${day}`;
            }

            var date = randomDate(new Date(1989, 3, 16), new Date());
            var url = `http://dilbert.com/strip/${date}`
            axios.get(url).then(response => {
                var $ = cheerio.load(response.data);
                var comicUrl = $('.img-comic').attr('src');
                bot.reply(message, {files: [`${comicUrl}.png`]});
                convo.next();
            });
        });
      
    });

    controller.hears(["today comic"], 'direct_message,direct_mention', function(bot, message) {
      
        bot.startConversation(message, function(err, convo) {
            var today = new Date();
            var year = today.getFullYear();
            var month = today.getMonth() + 1
            month = month < 10 ? `0${month}`: month;
            var day = today.getDate();
            day = day < 10 ? `0${day}`: day;
            var date = `${year}-${month}-${day}`;
            var url = `http://dilbert.com/strip/${date}`
            axios.get(url).then(response => {
                var $ = cheerio.load(response.data);
                var comicUrl = $('.img-comic').attr('src');
                bot.reply(message, {files: [`${comicUrl}.png`]});
                convo.next();
            });
        });
      
    });

    controller.hears(['comic'], 'direct_message,direct_mention', function(bot, message) {

        bot.startConversation(message, function(err, convo) {

            convo.ask('Tell me a date in the this format: yyyy-mm-dd', function(response, convo) {
                var url = `http://dilbert.com/strip/${response.text}`
                axios.get(url).then(response => {
                    var $ = cheerio.load(response.data);
                    var comicUrl = $('.img-comic').attr('src');
                    bot.reply(message, {files: [`${comicUrl}.png`]});
                    convo.next();
                });
            });

        });

    });
  

    controller.hears(['question'], 'direct_message,direct_mention', function(bot, message) {

        bot.createConversation(message, function(err, convo) {

            // create a path for when a user says YES
            convo.addMessage({
                text: 'How wonderful.',
            },'yes_thread');

            // create a path for when a user says NO
            // mark the conversation as unsuccessful at the end
            convo.addMessage({
                text: 'Cheese! It is not for everyone.',
                action: 'stop', // this marks the converation as unsuccessful
            },'no_thread');

            // create a path where neither option was matched
            // this message has an action field, which directs botkit to go back to the `default` thread after sending this message.
            convo.addMessage({
                text: 'Sorry I did not understand. Say `yes` or `no`',
                action: 'default',
            },'bad_response');

            // Create a yes/no question in the default thread...
            convo.ask('Do you like cheese?', [
                {
                    pattern:  bot.utterances.yes,
                    callback: function(response, convo) {
                        convo.gotoThread('yes_thread');
                    },
                },
                {
                    pattern:  bot.utterances.no,
                    callback: function(response, convo) {
                        convo.gotoThread('no_thread');
                    },
                },
                {
                    default: true,
                    callback: function(response, convo) {
                        convo.gotoThread('bad_response');
                    },
                }
            ]);

            convo.activate();

            // capture the results of the conversation and see what happened...
            convo.on('end', function(convo) {

                if (convo.successful()) {
                    // this still works to send individual replies...
                    bot.reply(message, 'Let us eat some!');

                    // and now deliver cheese via tcp/ip...
                }

            });
        });

    });

};
