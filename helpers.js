if (Meteor.isClient) {

    Handlebars.registerHelper('searchq',function(input){
        return Session.get("searchq");
    });
    Handlebars.registerHelper('userSearches',function(input){
        return UserSearches.find({userid: Meteor.userId()}).fetch();
    });
    Handlebars.registerHelper('viewingSavedSearch',function(input){
        return Session.get('userSearch');
    });

}
