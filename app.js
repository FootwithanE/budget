// Budget Logic Controller
var budgetController = (function() {

    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function(totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    };

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var calculateTotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(cur => {
            sum += cur.value;
        });
        data.totals[type] = sum;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    };

    // public functions
    return {
        addItem: function(type, des, val) {
            var newItem, ID;
            // new id is last id + 1
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }
            // income vs expense
            if (type === 'inc') {
                newItem = new Income(ID, des, val);
            } else if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            }
            data.allItems[type].push(newItem);
            return newItem;
        },

        deleteItem: function(type, id) {
            var ids, index;
            // retrieve all ids from array of item objects
            ids = data.allItems[type].map(current => {
                return current.id;
            });
            // retrieve index of correct id
            index = ids.indexOf(id);
            // remove item with id provided from budget
            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }
        },

        calculateBudget: function() {
            // calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');
            // calculate budget (income - expenses)
            data.budget = data.totals.inc - data.totals.exp;
            // calculate % of income spent
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function() {
            data.allItems.exp.forEach(cur => {
                cur.calcPercentage(data.totals.inc);
            });
        },

        getPercentages: function() {
            var allPercent = data.allItems.exp.map(cur => {
                return cur.getPercentage();
            });
            return allPercent;
        },

        getBudget: function() {
            return {
                budget: data.budget,
                totalIncome: data.totals.inc,
                totalExpenses: data.totals.exp,
                percentage: data.percentage
            };
        },

        testing: function() {
            console.log(data);
        }
    };

})();

// UI Controller
var UIController = (function() {

    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expenseContainer: '.expenses__list',
        budgetAvailable: '.budget__value',
        totalIncome: '.budget__income--value',
        totalExpenses: '.budget__expenses--value',
        expensePercentage: '.budget__expenses--percentage',
        container: '.container'
    };
    
    return {
        getInput: function() {
            return {
                type: document.querySelector(DOMstrings.inputType).value, // retrieve inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },

        addListItem: function(obj, type) {
            var html, newHtml, element;
            // create HTML
            if (type === 'inc') {
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                element = DOMstrings.expenseContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // populate with data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', obj.value);

            // insert HTML at end of list (beforeend)
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

        },

        deleteListItem: function(id) {
            var element = document.getElementById(id);
            // must remove as child - so must move up one to parent first
            element.parentNode.removeChild(element);
        },

        clearFields: function() {
            var fields, fieldsArray;
            // select value and description
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            // use array slice to convert list to array
            fieldsArray = Array.prototype.slice.call(fields);
            // loop and clear fields
            fieldsArray.forEach(element => {
                element.value = "";
            });
            // set select back to description
            fieldsArray[0].focus();
        },

        displayBudget: function(obj) {

            document.querySelector(DOMstrings.budgetAvailable).textContent = obj.budget;
            document.querySelector(DOMstrings.totalIncome).textContent = obj.totalIncome;
            document.querySelector(DOMstrings.totalExpenses).textContent = obj.totalExpenses;

            if (obj.percentage > 0) {
                document.querySelector(DOMstrings.expensePercentage).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMstrings.expensePercentage).textContent = '--';
            }

        },

        getDOMstrings: function() {
            return DOMstrings;
        }
    };
})();

// Global Application Controller
var controller = (function(budgetCtrl, UIctrl) {

    var setEventListeners = function() {
        var DOM = UIctrl.getDOMstrings();

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function(e) {
            // if enter is hit - add item
            if (e.key === 'Enter' || e.which === 13) {
                ctrlAddItem();
            }
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
    };

    var updateBudget = function() {
        // calculate budget
        budgetCtrl.calculateBudget();
        // return budget
        var budget = budgetCtrl.getBudget();
        // display budget to UI
        UIctrl.displayBudget(budget);
    };

    var updatePercentages = function() {
        // calculate percentages
        budgetCtrl.calculatePercentages();
        // read percentage from budget
        var percentages = budgetCtrl.getPercentages();
        // update UI
        console.log(percentages);
    };

    var ctrlAddItem = function() {
        var input, newItem;
        // get the input data
        input = UIctrl.getInput();
        // validate input (description exists, value is num > 0)
        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            // add item to controller form input object
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);
            // add item to UI
            UIctrl.addListItem(newItem, input.type);
            // clear fields
            UIctrl.clearFields();
            // calculate and update budget
            updateBudget();
            // update percentages
            updatePercentages();
        }

    };

    var ctrlDeleteItem = function(e) {
        var itemID, splitID, type, ID;
        // traverse the DOM as id changes with new elements
        itemID = e.target.parentNode.parentNode.parentNode.parentNode.id;

        if (itemID) {
            // isolate ID
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);
            // remove item
            budgetCtrl.deleteItem(type, ID);
            // remove from UI
            UIctrl.deleteListItem(itemID);
            // update budget
            updateBudget();
            // update percentages
            updatePercentages();
        }


    };

    return {
        init: function() {
            UIctrl.displayBudget({
                budget: 0,
                totalIncome: 0,
                totalExpenses: 0,
                percentage: -1
            });
            setEventListeners();
        }
    };
})(budgetController, UIController);

controller.init();