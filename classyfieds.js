Router.map(function() {
  this.route('#searches', {
      path: '/',
      action: function() {
  }});
});

Results = new Meteor.Collection("results");
UserSearches = new Meteor.Collection("user-searches");

Util = function() {};

Util.mongo = function() {};

Util.mongo.itemExists = function(_collection, selectors) {
    if (_collection.find(selectors).fetch({}).length > 0) {
        return true;
    }
    return false;
}

if (Meteor.isClient) {
    Meteor.subscribe("Results");
    Meteor.subscribe("UserSearches");

    Template.sidebar.events({
        'click #search-view-saved-btn': function () {
            // template data, if any, is available in 'this'     
            Session.set("searchq", this.q);
            Session.set("userSearch", this.q);
            Meteor.call('craigslistSearch', this.q);
        },
    }),

    Template.search.events({
        'click button': function (e) {
            e.preventDefault();
            // template data, if any, is available in 'this'     
            Session.set("searchq", $("input[name='q']").val());
            Session.set("userSearch", null);
            Meteor.call('craigslistSearch', $("input[name='q']").val());
        }
    }),
    Template.savedSearch.events({
        'click #search-remove-btn': function () {
            // template data, if any, is available in 'this'     
            _search = UserSearches.findOne({userid: Meteor.userId(), q: Session.get("searchq")});
            if (_search) {
                Meteor.call('removeUserSearch', Session.get("searchq"));
                Session.set("userSearch", null);
            }
        },
    }),

    Template.searchResults.events({
        'click #search-add-btn': function () {
            // template data, if any, is available in 'this'     
            if (!Util.mongo.itemExists(UserSearches, {userid: Meteor.userId(), q: Session.get("searchq")})) {
                UserSearches.insert({userid: Meteor.userId(), q: Session.get("searchq")});
            } else {
            }
        },
    }),

    Template.searchResultsTable.helpers({
        results: function() {
                     return Results.find().fetch();
                 },
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });

    var parser = new xml2js.Parser({attrkey: '@'});

    var Craigslist = function(postal_code) {
        var _this = this;
        this.postal_code = postal_code;

        this.parseSearchResponse = function(response) {
            output = Array();
            for (i = 0; i < response['rdf:RDF']['item'].length; i++) { 
                item = response['rdf:RDF']['item'][i];
                formattedItem = { 
                    raw: item,
                    date: item['dc:date'],
                    link: item['link'],
                    title: item['title'],
                    issued: item['dcterms:issued'],
                    description: item['description'],
                }
                if ('enc:enclosure' in item) {
                    formattedItem['img'] = item['enc:enclosure'][0]['@'];
                }
                output.push(formattedItem);
            }

            return output;
        }

        var keywordSearch = function(q) {
            console.log('Searching for keyword:' + q);
            url = "https://dayton.craigslist.org/search/sss?query=" + q + "&s=0&sort=rel&format=rss";
            Meteor.http.get(url, function(err, data) {
                if (err)
                  console.log(err);
                parser.parseString(data.content, function (err, result) {
                    Results.remove({});
                    Results.insert({craigslist: _this.parseSearchResponse(result)});
                });
            });
        };

        return {
            keywordSearch: keywordSearch 
        };

    };
    
    craigslist = new Craigslist(47374);
    Meteor.methods({
        craigslistSearch: function(q) {
            craigslist.keywordSearch(q);
        },
        removeAllItems: function() {
            return Results.remove({});
        },
        removeUserSearch: function(q) {
            UserSearches.remove({userid: Meteor.userId(), q: q});
       },
    });
}



